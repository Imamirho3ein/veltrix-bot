import type { Bot } from "grammy";
import type { BotContext } from "../session.js";
import { addTicket, addTicketReply, getAdmins, isAdmin } from "../store.js";
import { adminReplyKeyboard, supportKeyboard } from "../keyboards.js";
import { answer, editOrSend, escapeHtml, truncate } from "../ui.js";

async function forwardToAdmins(
  bot: Bot<BotContext>,
  input: { userId: number; name: string; username?: string; text: string },
): Promise<number> {
  const admins = await getAdmins();
  const header = `📨 <b>پیام پشتیبانی</b>\n\n👤 ${escapeHtml(input.name)}${input.username ? ` (@${escapeHtml(input.username)})` : ""}\n🆔 <code>${input.userId}</code>\n\n${escapeHtml(input.text)}`;
  let delivered = 0;
  await Promise.all(
    admins.map(async (adminId) => {
      try {
        await bot.api.sendMessage(adminId, header, {
          parse_mode: "HTML",
          reply_markup: adminReplyKeyboard(input.userId),
        });
        delivered += 1;
      } catch (error) {
        console.warn(`[bot] could not deliver support message to ${adminId}`, error);
      }
    }),
  );
  return delivered;
}

export function registerSupport(bot: Bot<BotContext>): void {
  bot.callbackQuery("menu:support", async (ctx) => {
    ctx.session.draft = null;
    ctx.session.calc = null;
    ctx.session.support = { awaiting: true };
    await answer(ctx);
    await editOrSend(
      ctx,
      `💬 <b>پشتیبانی ${escapeHtml("VELTRIX STUDIO")}</b>\n\nسوال یا پیام خود را بنویسید؛ همکاران ما در کمتر از ۲۴ ساعت کاری پاسخ می‌دهند.\n\nمی‌توانید عکس یا فایل هم بفرستید.`,
      { parse_mode: "HTML", reply_markup: supportKeyboard() },
    );
  });

  bot.command("support", async (ctx) => {
    ctx.session.draft = null;
    ctx.session.calc = null;
    ctx.session.support = { awaiting: true };
    await ctx.reply("💬 پیام خود را برای پشتیبانی بنویسید:", {
      reply_markup: supportKeyboard(),
    });
  });

  bot.callbackQuery("support:cancel", async (ctx) => {
    ctx.session.support = null;
    await answer(ctx, "لغو شد.");
    await editOrSend(ctx, "✖️ ارسال پیام لغو شد.", {
      parse_mode: "HTML",
      reply_markup: supportKeyboard(),
    });
  });

  bot.callbackQuery(/^sup:r:(\d+)$/, async (ctx) => {
    if (!(await isAdmin(ctx.from?.id))) {
      await answer(ctx, "⛔️ دسترسی ندارید.", true);
      return;
    }
    const userId = Number(ctx.match[1]);
    ctx.session.replyTo = userId;
    await answer(ctx);
    await editOrSend(
      ctx,
      `✉️ پاسخ خود را برای کاربر <code>${userId}</code> بنویسید.\n\nبرای انصراف /cancel را بزنید.`,
      { parse_mode: "HTML", reply_markup: adminReplyKeyboard(userId) },
    );
  });

  // Incoming support messages from customers.
  bot.on(["message:text", "message:photo", "message:document"], async (ctx, next) => {
    if (!ctx.session.support?.awaiting) {
      await next();
      return;
    }
    if (ctx.message.text?.startsWith("/")) {
      await next();
      return;
    }
    const from = ctx.from;
    if (!from || ctx.chat.type !== "private") {
      await next();
      return;
    }

    const name = [from.first_name, from.last_name].filter(Boolean).join(" ").trim() || "کاربر";
    let text: string;

    if (ctx.message.text) {
      text = ctx.message.text.trim();
    } else if (ctx.message.photo) {
      text = "📷 [عکس ارسال شد]";
      const largest = ctx.message.photo[ctx.message.photo.length - 1];
      if (largest) {
        try {
          const admins = await getAdmins();
          await Promise.all(
            admins.map((adminId) =>
              bot.api
                .sendPhoto(adminId, largest.file_id, {
                  caption: `📷 عکس از ${name} (${from.id})`,
                  reply_markup: adminReplyKeyboard(from.id),
                })
                .catch(() => undefined),
            ),
          );
        } catch (error) {
          console.warn("[bot] could not forward support photo", error);
        }
      }
    } else if (ctx.message.document) {
      text = `📎 [فایل: ${ctx.message.document.file_name ?? "بدون نام"}]`;
      const fileId = ctx.message.document.file_id;
      try {
        const admins = await getAdmins();
        await Promise.all(
          admins.map((adminId) =>
            bot.api
              .sendDocument(adminId, fileId, {
                caption: `📎 فایل از ${name} (${from.id})`,
                reply_markup: adminReplyKeyboard(from.id),
              })
              .catch(() => undefined),
          ),
        );
      } catch (error) {
        console.warn("[bot] could not forward support document", error);
      }
    } else {
      await next();
      return;
    }

    if (text.length < 2) {
      await ctx.reply("پیام خیلی کوتاه است. لطفاً دوباره بنویسید.");
      return;
    }

    ctx.session.support = null;
    await addTicket({ telegramId: from.id, name, message: text });

    let delivered = 1;
    if (ctx.message.text) {
      delivered = await forwardToAdmins(bot, {
        userId: from.id,
        name,
        username: from.username,
        text: truncate(text, 3000),
      });
    }

    await ctx.reply(
      delivered > 0
        ? "✅ پیام شما برای تیم پشتیبانی ارسال شد. به‌زودی پاسخ می‌دهیم."
        : "✅ پیام شما ثبت شد. اگر پاسخ دیر شد، دوباره تلاش کنید.",
      { reply_markup: { remove_keyboard: true } },
    );
  });

  // Admin replying to a forwarded ticket.
  bot.on("message:text", async (ctx, next) => {
    if (!ctx.session.replyTo) {
      await next();
      return;
    }
    if (!(await isAdmin(ctx.from?.id))) {
      ctx.session.replyTo = null;
      await next();
      return;
    }
    const text = ctx.message.text.trim();
    if (text.startsWith("/")) {
      await next();
      return;
    }
    const userId = ctx.session.replyTo;
    ctx.session.replyTo = null;
    try {
      await bot.api.sendMessage(
        userId,
        `💬 <b>پاسخ پشتیبانی</b>\n\n${escapeHtml(text)}`,
        { parse_mode: "HTML" },
      );
      await addTicketReply(userId, text, "admin");
      await ctx.reply("✅ پاسخ برای کاربر ارسال شد.", { reply_markup: { remove_keyboard: true } });
    } catch (error) {
      console.error("[bot] could not send support reply", error);
      await ctx.reply("❌ ارسال پاسخ انجام نشد. ممکن است کاربر ربات را بلاک کرده باشد.");
    }
  });
}
