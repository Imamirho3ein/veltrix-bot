import type { Bot } from "grammy";
import type { BotContext } from "../session.js";
import { orderDetailKeyboard, myOrdersKeyboard, homeRow } from "../keyboards.js";
import {
  listOrdersForUser,
  findOrderById,
  getAdmins,
  isAdmin,
  setOrderStatus,
} from "../store.js";
import type { Order } from "../types.js";
import {
  answer,
  escapeHtml,
  formatDate,
  progressBar,
  statusLine,
  STATUS_ICONS,
  STATUS_LABELS,
} from "../ui.js";

export function orderDetailText(order: Order, admin = false): string {
  const contact = admin
    ? `\n🆔 <code>${order.telegramId}</code>${order.username ? ` (@${escapeHtml(order.username)})` : ""}`
    : "";

  const notes =
    admin && order.notes?.length
      ? `\n\n🗒 <b>یادداشت‌های داخلی</b>\n${order.notes.map((note) => `• ${escapeHtml(note)}`).join("\n")}`
      : "";

  const history = order.history
    .slice(-4)
    .map((item) => `• ${STATUS_LABELS[item.status]} — ${formatDate(item.at)}`)
    .join("\n");

  return `🔖 <b>سفارش ${order.reference}</b>

${progressBar(order.status)}
وضعیت: ${statusLine(order.status)}
🎨 خدمت: ${escapeHtml(order.serviceTitle)}
💎 پلن: ${escapeHtml(order.planLabel)}
👤 نام: ${escapeHtml(order.name)}
📱 تلفن: <a href="tel:${escapeHtml(order.phone)}">${escapeHtml(order.phone)}</a>${contact}
💰 بودجه: ${escapeHtml(order.budget)}
📎 بریف: ${order.brief ? "پیوست شده" : "ندارد"}
💳 پرداخت: ${order.paid ? "ثبت شده ✅" : "ثبت نشده"}

📝 ${escapeHtml(order.description)}

🕒 ثبت: ${formatDate(order.createdAt)}
🔄 آخرین به‌روزرسانی: ${formatDate(order.updatedAt)}

📌 <b>تاریخچه</b>
${history}${notes}`;
}

export function registerAccount(bot: Bot<BotContext>): void {
  const showOrders = async (ctx: BotContext) => {
    const from = ctx.from;
    if (!from) return;
    const orders = await listOrdersForUser(from.id);
    if (orders.length === 0) {
      await ctx.reply(
        "📁 هنوز سفارشی ثبت نکرده‌اید.\n\nبرای شروع، از «🚀 ثبت سفارش» در منوی اصلی استفاده کنید.",
        { reply_markup: homeRow() },
      );
      return;
    }
    await ctx.reply("📁 <b>سفارش‌های شما</b>\n\nبرای دیدن جزئیات، روی هر سفارش بزنید:", {
      parse_mode: "HTML",
      reply_markup: myOrdersKeyboard(orders),
    });
  };

  bot.command("orders", async (ctx) => {
    await showOrders(ctx);
  });

  bot.callbackQuery("menu:myorders", async (ctx) => {
    await answer(ctx);
    await showOrders(ctx);
  });

  bot.callbackQuery(/^ord:([a-zA-Z0-9-]+)$/, async (ctx) => {
    const from = ctx.from;
    const order = await findOrderById(ctx.match[1]!);
    if (!order) {
      await answer(ctx, "سفارش پیدا نشد.", true);
      return;
    }
    const admin = await isAdmin(from?.id);
    if (!from || (order.telegramId !== from.id && !admin)) {
      await answer(ctx, "دسترسی ندارید.", true);
      return;
    }
    await answer(ctx);
    await ctx.reply(orderDetailText(order, admin), {
      parse_mode: "HTML",
      reply_markup: orderDetailKeyboard(order, from.id),
    });
  });

  bot.callbackQuery(/^ord:cancel:([a-zA-Z0-9-]+)$/, async (ctx) => {
    const from = ctx.from;
    if (!from) return;
    const order = await findOrderById(ctx.match[1]!);
    if (!order || order.telegramId !== from.id) {
      await answer(ctx, "سفارش پیدا نشد.", true);
      return;
    }
    if (order.status !== "PENDING" && order.status !== "REVIEWING") {
      await answer(ctx, "این سفارش دیگر قابل لغو نیست. با پشتیبانی تماس بگیرید.", true);
      return;
    }
    const updated = await setOrderStatus(order.id, "CANCELLED");
    await answer(ctx, "سفارش لغو شد.");
    if (updated) {
      await ctx.reply(
        `✖️ سفارش <code>${updated.reference}</code> لغو شد.\n\nاگر اشتباه شد یا سوالی دارید، از «💬 پشتیبانی» پیام بدهید.`,
        { parse_mode: "HTML", reply_markup: homeRow() },
      );
      const admins = await getAdmins();
      await Promise.all(
        admins.map((adminId) =>
          bot.api
            .sendMessage(
              adminId,
              `${STATUS_ICONS.CANCELLED} مشتری سفارش <code>${updated.reference}</code> را لغو کرد.\n👤 ${escapeHtml(updated.name)} — ${escapeHtml(updated.phone)}`,
              { parse_mode: "HTML" },
            )
            .catch(() => undefined),
        ),
      );
    }
  });
}
