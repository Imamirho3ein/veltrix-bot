import type { Bot } from "grammy";
import type { BotContext } from "./session.js";
import type { Order, OrderStatus, Referral } from "./types.js";
import { getAdmins, getChannelId } from "./store.js";
import { STATUS_LABELS, escapeHtml, formatDate, statusLine } from "./ui.js";
import { adminOrderKeyboard } from "./keyboards.js";

export function orderAdminText(order: Order): string {
  return `🆕 <b>سفارش جدید</b> — ${escapeHtml(order.reference)}

👤 ${escapeHtml(order.name)}
📱 <a href="tel:${escapeHtml(order.phone)}">${escapeHtml(order.phone)}</a>
🆔 <code>${order.telegramId}</code>${order.username ? ` (@${escapeHtml(order.username)})` : ""}

🎨 ${escapeHtml(order.serviceTitle)}
💎 ${escapeHtml(order.planLabel)}
💰 ${escapeHtml(order.budget)}
📎 بریف: ${order.brief ? "پیوست شده" : "ندارد"}
🕒 ${formatDate(order.createdAt)}

📝 ${escapeHtml(order.description)}`;
}

async function sendBriefToAdmin(
  bot: Bot<BotContext>,
  adminId: number,
  order: Order,
): Promise<void> {
  if (!order.brief) return;
  try {
    if (order.brief.kind === "photo") {
      await bot.api.sendPhoto(adminId, order.brief.fileId, {
        caption: `📎 بریف سفارش ${order.reference}`,
      });
    } else {
      await bot.api.sendDocument(adminId, order.brief.fileId, {
        caption: `📎 بریف سفارش ${order.reference}`,
      });
    }
  } catch (error) {
    console.warn("[bot] could not forward brief to admin", error);
  }
}

export async function notifyAdminsNewOrder(
  bot: Bot<BotContext>,
  order: Order,
): Promise<void> {
  const admins = await getAdmins();
  const text = orderAdminText(order);
  await Promise.all(
    admins.map(async (adminId) => {
      try {
        await bot.api.sendMessage(adminId, text, {
          parse_mode: "HTML",
          reply_markup: adminOrderKeyboard(order),
        });
        await sendBriefToAdmin(bot, adminId, order);
      } catch (error) {
        console.warn(`[bot] could not notify admin ${adminId}`, error);
      }
    }),
  );

  const channelId = await getChannelId();
  if (channelId) {
    try {
      await bot.api.sendMessage(
        channelId,
        `🆕 <b>سفارش جدید ثبت شد</b>\n\n🎨 ${escapeHtml(order.serviceTitle)}\n💎 ${escapeHtml(order.planLabel)}\n🕒 ${formatDate(order.createdAt)}\n\nبرای پیگیری در پنل مدیریت: /admin`,
        { parse_mode: "HTML" },
      );
    } catch (error) {
      console.warn("[bot] could not post new order to the channel", error);
    }
  }
}

export async function notifyCustomerStatus(
  bot: Bot<BotContext>,
  order: Order,
  status: OrderStatus,
): Promise<void> {
  try {
    await bot.api.sendMessage(
      order.telegramId,
      `🔔 <b>وضعیت سفارش شما به‌روزرسانی شد</b>\n\n🔖 کد پیگیری: <code>${order.reference}</code>\n🎨 ${escapeHtml(order.serviceTitle)}\n\nوضعیت جدید: ${statusLine(status)}\n\n${
        status === "CONTACTED"
          ? "به‌زودی همکاران ما با شما تماس می‌گیرند."
          : status === "IN_PROGRESS"
            ? "پروژهٔ شما وارد مرحلهٔ اجرا شد. 🚀"
            : status === "DELIVERED"
              ? "پروژه با موفقیت تحویل داده شد. از اعتماد شما سپاسگزاریم. 🙏"
              : "برای پیگیری، از بخش «سفارش‌های من» استفاده کنید."
      }`,
      { parse_mode: "HTML" },
    );
  } catch (error) {
    console.warn(`[bot] could not notify customer ${order.telegramId}`, error);
  }
}

export function statusChangedText(order: Order, status: OrderStatus): string {
  return `✅ وضعیت سفارش <code>${order.reference}</code> به «${STATUS_LABELS[status]}» تغییر کرد و به مشتری اطلاع داده شد.`;
}

export async function notifyAdminsNewReferral(
  bot: Bot<BotContext>,
  referral: Referral,
  totalForPayload: number,
): Promise<void> {
  const admins = await getAdmins();
  const text = `📣 <b>لید جدید از کمپین تبلیغاتی</b>

🏷 کمپین: <code>${escapeHtml(referral.payload)}</code> (کل: ${totalForPayload})
👤 ${escapeHtml(referral.firstName ?? "—")}${referral.username ? ` (@${escapeHtml(referral.username)})` : ""}
🆔 <code>${referral.telegramId}</code>
🕒 ${formatDate(referral.createdAt)}`;

  await Promise.all(
    admins.map(async (adminId) => {
      try {
        await bot.api.sendMessage(adminId, text, { parse_mode: "HTML" });
      } catch (error) {
        console.warn(`[bot] could not notify admin ${adminId} of referral`, error);
      }
    }),
  );
}
