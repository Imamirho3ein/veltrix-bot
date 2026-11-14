import { InlineKeyboard, InputFile, type Bot } from "grammy";
import type { BotContext } from "../session.js";
import type { Order, OrderStatus } from "../types.js";
import {
  addAdmin,
  addOrderNote,
  allCustomerIds,
  exportOrdersCsv,
  findOrderById,
  getAdmins,
  getChannelId,
  isAdmin,
  listOrders,
  orderStats,
  searchOrders,
  setOrderStatus,
  setSetting,
  toggleOrderPaid,
} from "../store.js";
import {
  adminMenu,
  adminOrderKeyboard,
  adminOrdersKeyboard,
  adminOrdersListKeyboard,
  broadcastConfirmKeyboard,
  statusPickerKeyboard,
} from "../keyboards.js";
import { orderDetailText } from "./account.js";
import { notifyCustomerStatus, statusChangedText } from "../notify.js";
import {
  answer,
  editOrSend,
  escapeHtml,
  formatMillion,
  STATUS_ICONS,
  STATUS_LABELS,
  statusLine,
} from "../ui.js";

const PAGE_SIZE = 8;

async function requireAdmin(ctx: BotContext): Promise<boolean> {
  const allowed = await isAdmin(ctx.from?.id);
  if (!allowed) {
    await answer(ctx, "⛔️ این بخش فقط برای مدیران است.", true);
  }
  return allowed;
}

function adminWelcomeText(): string {
  return `🛠 <b>پنل مدیریت</b>\n\nاز منوی زیر بخش موردنظر را انتخاب کنید:`;
}

function homeRowBack() {
  return new InlineKeyboard().text("↩️ پنل مدیریت", "adm:home");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function registerAdmin(bot: Bot<BotContext>): void {
  bot.command("admin", async (ctx) => {
    const from = ctx.from;
    if (!from) return;

    if (await isAdmin(from.id)) {
      ctx.session.draft = null;
      ctx.session.adminAction = null;
      ctx.session.replyTo = null;
      await ctx.reply(adminWelcomeText(), {
        parse_mode: "HTML",
        reply_markup: adminMenu(),
      });
      return;
    }

    const admins = await getAdmins();
    if (admins.length === 0) {
      await addAdmin(from.id);
      ctx.session.draft = null;
      await ctx.reply(
        `👑 شما به‌عنوان <b>مدیر ربات</b> ثبت شدید.\n\nشناسهٔ شما: <code>${from.id}</code>\nبرای امنیت بیشتر، همین عدد را در فایل <code>.env</code> مقابل <code>ADMIN_TELEGRAM_IDS</code> هم قرار دهید.`,
        { parse_mode: "HTML" },
      );
      await ctx.reply(adminWelcomeText(), {
        parse_mode: "HTML",
        reply_markup: adminMenu(),
      });
      return;
    }

    await ctx.reply(
      `⛔️ دسترسی مدیریت ندارید.\n\nشناسهٔ تلگرام شما: <code>${from.id}</code>\nاین عدد را به مدیر ربات اعلام کنید.`,
      { parse_mode: "HTML" },
    );
  });

  bot.command("setchannel", async (ctx) => {
    if (!(await isAdmin(ctx.from?.id))) {
      await ctx.reply("⛔️ این دستور فقط برای مدیران است.");
      return;
    }
    const channel = (ctx.match ?? "").toString().trim();
    if (!channel) {
      const current = await getChannelId();
      await ctx.reply(
        `📣 کانال فعلی: <code>${escapeHtml(current || "تنظیم نشده")}</code>\n\nبرای تغییر:\n<code>/setchannel @YourChannel</code>`,
        { parse_mode: "HTML" },
      );
      return;
    }
    await setSetting("channelId", channel);
    await ctx.reply(
      `✅ کانال اطلاع‌رسانی روی <b>${escapeHtml(channel)}</b> تنظیم شد.\n\nیادتان باشد ربات باید ادمین کانال باشد.`,
      { parse_mode: "HTML" },
    );
  });

  bot.callbackQuery("adm:home", async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    await editOrSend(ctx, adminWelcomeText(), {
      parse_mode: "HTML",
      reply_markup: adminMenu(),
    });
  });

  const showList = async (ctx: BotContext, orders: Order[], title: string) => {
    if (orders.length === 0) {
      await editOrSend(ctx, title, {
        parse_mode: "HTML",
        reply_markup: homeRowBack(),
      });
      return;
    }
    await editOrSend(ctx, `${title}\n\n${orders.length} سفارش — روی هر مورد بزنید:`, {
      parse_mode: "HTML",
      reply_markup: adminOrdersKeyboard(orders),
    });
  };

  bot.callbackQuery("adm:new", async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    const orders = (await listOrders()).filter((order) =>
      (["PENDING", "REVIEWING", "CONTACTED"] as OrderStatus[]).includes(order.status),
    );
    await answer(ctx);
    await showList(
      ctx,
      orders.slice(0, 15),
      orders.length === 0
        ? "📥 سفارش جدیدی در انتظار بررسی نیست."
        : "📥 <b>سفارش‌های در انتظار</b>",
    );
  });

  bot.callbackQuery(/^adm:all:(\d+)$/, async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    const orders = await listOrders();
    const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
    const page = Math.min(Math.max(0, Number(ctx.match[1])), totalPages - 1);
    const slice = orders.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    await answer(ctx);
    await editOrSend(
      ctx,
      `📋 <b>همهٔ سفارش‌ها</b> — صفحهٔ ${page + 1} از ${totalPages}\n\n${orders.length} سفارش ثبت شده است.`,
      {
        parse_mode: "HTML",
        reply_markup: adminOrdersListKeyboard(slice, page, totalPages),
      },
    );
  });

  bot.callbackQuery("adm:stats", async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    const stats = await orderStats();
    const lines = (Object.keys(stats.byStatus) as OrderStatus[])
      .map((status) => `${STATUS_ICONS[status]} ${STATUS_LABELS[status]}: ${stats.byStatus[status]}`)
      .join("\n");
    const services = stats.byService.length
      ? stats.byService.map((item) => `• ${escapeHtml(item.title)}: ${item.count}`).join("\n")
      : "—";
    await answer(ctx);
    await editOrSend(
      ctx,
      `📊 <b>آمار ربات</b>

📋 کل سفارش‌ها: <b>${stats.total}</b>
📅 امروز: <b>${stats.today}</b>
🗓 هفتهٔ اخیر: <b>${stats.thisWeek}</b>
👥 مشتریان: <b>${stats.customers}</b>
💳 پرداخت‌شده: <b>${stats.paid}</b>
💰 درآمد ثبت‌شده: <b>${formatMillion(stats.revenue)}</b>

${lines}

🏆 <b>پرتقاضاترین خدمات</b>
${services}`,
      { parse_mode: "HTML", reply_markup: adminMenu() },
    );
  });

  bot.callbackQuery("adm:find", async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    ctx.session.adminAction = "search";
    await answer(ctx);
    await editOrSend(
      ctx,
      "🔎 کد پیگیری، نام، شمارهٔ تماس یا آیدی تلگرام را بنویسید:\n\nبرای انصراف /cancel را بزنید.",
      { parse_mode: "HTML", reply_markup: homeRowBack() },
    );
  });

  bot.callbackQuery("adm:csv", async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    await answer(ctx, "در حال ساخت فایل…");
    try {
      const { file, count } = await exportOrdersCsv();
      await ctx.replyWithDocument(new InputFile(file, "veltrix-orders.csv"), {
        caption: `📤 خروجی سفارش‌ها — ${count} ردیف`,
      });
    } catch (error) {
      console.error("[bot] CSV export failed", error);
      await ctx.reply("❌ ساخت فایل خروجی انجام نشد.");
    }
  });

  bot.callbackQuery("adm:bcast", async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    ctx.session.adminAction = "broadcast_all";
    await answer(ctx);
    await editOrSend(
      ctx,
      "📣 متن پیام همگانی را بنویسید. این پیام برای همهٔ مشتریانی که سفارش ثبت کرده‌اند ارسال می‌شود.\n\nبرای انصراف /cancel را بزنید.",
      { parse_mode: "HTML", reply_markup: homeRowBack() },
    );
  });

  bot.callbackQuery("adm:bc:cancel", async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    ctx.session.broadcastText = null;
    await answer(ctx, "لغو شد.");
    await editOrSend(ctx, "✖️ پیام همگانی لغو شد.", {
      parse_mode: "HTML",
      reply_markup: adminMenu(),
    });
  });

  bot.callbackQuery("adm:bc:confirm", async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    const text = ctx.session.broadcastText;
    if (!text) {
      await answer(ctx, "متنی برای ارسال نیست.", true);
      return;
    }
    ctx.session.broadcastText = null;
    await answer(ctx, "در حال ارسال…");
    const customers = await allCustomerIds();
    let sent = 0;
    for (const userId of customers) {
      try {
        await bot.api.sendMessage(userId, `📣 <b>${escapeHtml("VELTRIX STUDIO")}</b>\n\n${escapeHtml(text)}`, {
          parse_mode: "HTML",
        });
        sent += 1;
      } catch {
        // User blocked the bot — skip.
      }
      await sleep(60);
    }
    await ctx.reply(`✅ پیام همگانی برای ${sent} از ${customers.length} مشتری ارسال شد.`, {
      reply_markup: adminMenu(),
    });
  });

  bot.callbackQuery(/^adm:o:([a-zA-Z0-9-]+)$/, async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    const order = await findOrderById(ctx.match[1]!);
    if (!order) {
      await answer(ctx, "سفارش پیدا نشد.", true);
      return;
    }
    await answer(ctx);
    await editOrSend(ctx, orderDetailText(order, true), {
      parse_mode: "HTML",
      reply_markup: adminOrderKeyboard(order),
    });
  });

  bot.callbackQuery(/^adm:st:([a-zA-Z0-9-]+)$/, async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    const order = await findOrderById(ctx.match[1]!);
    if (!order) {
      await answer(ctx, "سفارش پیدا نشد.", true);
      return;
    }
    await answer(ctx);
    await editOrSend(
      ctx,
      `🔄 وضعیت فعلی: ${statusLine(order.status)}\n\nوضعیت جدید را انتخاب کنید:`,
      { parse_mode: "HTML", reply_markup: statusPickerKeyboard(order.id, order.status) },
    );
  });

  bot.callbackQuery(/^adm:s:([a-zA-Z0-9-]+):([A-Z_]+)$/, async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    const status = ctx.match[2] as OrderStatus;
    if (!(status in STATUS_LABELS)) {
      await answer(ctx, "وضعیت نامعتبر است.", true);
      return;
    }
    const updated = await setOrderStatus(ctx.match[1]!, status);
    if (!updated) {
      await answer(ctx, "سفارش پیدا نشد.", true);
      return;
    }
    await notifyCustomerStatus(bot, updated, status);
    await answer(ctx, "وضعیت به‌روزرسانی شد.");
    await editOrSend(
      ctx,
      `${orderDetailText(updated, true)}\n\n${statusChangedText(updated, status)}`,
      { parse_mode: "HTML", reply_markup: adminOrderKeyboard(updated) },
    );
  });

  bot.callbackQuery(/^adm:pay:([a-zA-Z0-9-]+)$/, async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    const updated = await toggleOrderPaid(ctx.match[1]!);
    if (!updated) {
      await answer(ctx, "سفارش پیدا نشد.", true);
      return;
    }
    await answer(ctx, updated.paid ? "پرداخت ثبت شد." : "پرداخت برداشته شد.");
    await editOrSend(ctx, orderDetailText(updated, true), {
      parse_mode: "HTML",
      reply_markup: adminOrderKeyboard(updated),
    });
  });

  bot.callbackQuery(/^adm:note:([a-zA-Z0-9-]+)$/, async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    const order = await findOrderById(ctx.match[1]!);
    if (!order) {
      await answer(ctx, "سفارش پیدا نشد.", true);
      return;
    }
    ctx.session.adminAction = "note";
    ctx.session.noteOrderId = order.id;
    await answer(ctx);
    await editOrSend(
      ctx,
      `📝 یادداشت داخلی برای <code>${order.reference}</code> بنویسید (مشتری آن را نمی‌بیند):`,
      { parse_mode: "HTML", reply_markup: homeRowBack() },
    );
  });

  bot.callbackQuery(/^adm:reply:([a-zA-Z0-9-]+)$/, async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    const order = await findOrderById(ctx.match[1]!);
    if (!order) {
      await answer(ctx, "سفارش پیدا نشد.", true);
      return;
    }
    ctx.session.replyTo = order.telegramId;
    await answer(ctx);
    await editOrSend(
      ctx,
      `✉️ پیام شما برای ${escapeHtml(order.name)} (<code>${order.telegramId}</code>) ارسال می‌شود.\n\nمتن پاسخ را بنویسید.`,
      { parse_mode: "HTML", reply_markup: homeRowBack() },
    );
  });

  bot.callbackQuery(/^adm:file:([a-zA-Z0-9-]+)$/, async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    const order = await findOrderById(ctx.match[1]!);
    if (!order?.brief) {
      await answer(ctx, "بریفی پیوست نشده است.", true);
      return;
    }
    await answer(ctx);
    try {
      if (order.brief.kind === "photo") {
        await ctx.replyWithPhoto(order.brief.fileId, {
          caption: `📎 بریف سفارش ${order.reference}`,
        });
      } else {
        await ctx.replyWithDocument(order.brief.fileId, {
          caption: `📎 بریف سفارش ${order.reference}`,
        });
      }
    } catch (error) {
      console.error("[bot] could not resend brief", error);
      await ctx.reply("❌ ارسال فایل انجام نشد.");
    }
  });

  bot.command("cancel", async (ctx) => {
    ctx.session.draft = null;
    ctx.session.adminAction = null;
    ctx.session.broadcastText = null;
    ctx.session.noteOrderId = null;
    ctx.session.replyTo = null;
    ctx.session.support = null;
    await ctx.reply("✖️ عملیات جاری لغو شد.", {
      reply_markup: { remove_keyboard: true },
    });
  });

  // Text input while an admin action is waiting for a value.
  bot.on("message:text", async (ctx, next) => {
    const action = ctx.session.adminAction;
    if (!action) {
      await next();
      return;
    }
    if (!(await isAdmin(ctx.from?.id))) {
      ctx.session.adminAction = null;
      await next();
      return;
    }
    const text = ctx.message.text.trim();
    if (text.startsWith("/")) {
      await next();
      return;
    }

    if (action === "search") {
      ctx.session.adminAction = null;
      const matches = searchOrders(await listOrders(), text);
      if (matches.length === 0) {
        await ctx.reply("❌ سفارشی با این مشخصات پیدا نشد. دوباره تلاش کنید یا /admin را بزنید.", {
          reply_markup: adminMenu(),
        });
        return;
      }
      if (matches.length === 1) {
        await ctx.reply(orderDetailText(matches[0]!, true), {
          parse_mode: "HTML",
          reply_markup: adminOrderKeyboard(matches[0]!),
        });
        return;
      }
      await ctx.reply(`🔎 ${matches.length} سفارش پیدا شد:`, {
        reply_markup: adminOrdersKeyboard(matches.slice(0, 15)),
      });
      return;
    }

    if (action === "note") {
      const orderId = ctx.session.noteOrderId;
      ctx.session.adminAction = null;
      ctx.session.noteOrderId = null;
      if (!orderId) {
        await ctx.reply("سفارش مشخص نیست. از پنل دوباره تلاش کنید.", { reply_markup: adminMenu() });
        return;
      }
      const updated = await addOrderNote(orderId, text);
      if (!updated) {
        await ctx.reply("سفارش پیدا نشد.", { reply_markup: adminMenu() });
        return;
      }
      await ctx.reply(orderDetailText(updated, true), {
        parse_mode: "HTML",
        reply_markup: adminOrderKeyboard(updated),
      });
      return;
    }

    if (action === "broadcast_all") {
      ctx.session.adminAction = null;
      ctx.session.broadcastText = text;
      const customers = await allCustomerIds();
      await ctx.reply(
        `📣 پیام برای <b>${customers.length}</b> مشتری ارسال می‌شود:\n\n${escapeHtml(text)}\n\nتأیید می‌کنید؟`,
        { parse_mode: "HTML", reply_markup: broadcastConfirmKeyboard() },
      );
      return;
    }

    if (action === "broadcast") {
      ctx.session.adminAction = null;
      const channel = await getChannelId();
      if (!channel) {
        await ctx.reply("کانال تنظیم نشده است. با /setchannel تنظیم کنید.");
        return;
      }
      try {
        await bot.api.sendMessage(channel, text);
        await ctx.reply(`✅ پست در ${channel} منتشر شد.`, { reply_markup: adminMenu() });
      } catch (error) {
        console.error("[bot] broadcast failed", error);
        await ctx.reply(
          "❌ ارسال به کانال انجام نشد. مطمئن شوید ربات ادمین کانال است و شناسهٔ کانال درست است.",
          { reply_markup: adminMenu() },
        );
      }
      return;
    }

    await next();
  });
}
