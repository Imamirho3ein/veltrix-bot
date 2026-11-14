import type { Bot } from "grammy";
import type { BotContext } from "../session.js";
import { env } from "../config.js";
import { aboutText, faq } from "../data.js";
import { faqListKeyboard, homeRow, mainMenu } from "../keyboards.js";
import { answer, editOrSend, escapeHtml } from "../ui.js";

export function welcomeText(name?: string): string {
  return `سلام${name ? ` ${escapeHtml(name)}` : ""} 👋
به <b>${env.brandName}</b> خوش آمدید.

از اینجا می‌توانید تعرفه‌ها را ببینید، قیمت پروژه‌تان را برآورد کنید، نمونه‌کارها را ببینید، سفارش ثبت کنید و مستقیم با پشتیبانی گفتگو کنید.

یکی از گزینه‌های زیر را انتخاب کنید:`;
}

export function contactText(): string {
  return `📞 <b>راه‌های ارتباط با ما</b>

• تلگرام: ${env.supportUrl}
• کانال: ${env.channelUrl}
• اینستاگرام: ${env.instagramUrl}
• ایمیل: ${env.email}${env.phone ? `\n• تلفن: ${env.phone}` : ""}

🕒 شنبه تا پنجشنبه، ۱۰:۰۰ تا ۲۰:۰۰
⏱ پاسخ‌گویی: کمتر از ۲۴ ساعت کاری

برای ثبت درخواست سریع، از «🚀 ثبت سفارش» در منوی اصلی استفاده کنید.`;
}

export function registerMenu(bot: Bot<BotContext>): void {
  bot.command("start", async (ctx) => {
    ctx.session.draft = null;
    ctx.session.adminAction = null;
    ctx.session.calc = null;
    ctx.session.support = null;
    ctx.session.replyTo = null;
    await ctx.reply(welcomeText(ctx.from?.first_name), {
      parse_mode: "HTML",
      reply_markup: mainMenu(),
    });
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(welcomeText(ctx.from?.first_name), {
      parse_mode: "HTML",
      reply_markup: mainMenu(),
    });
  });

  bot.command("myid", async (ctx) => {
    await ctx.reply(
      `🆔 شناسهٔ تلگرام شما:\n<code>${ctx.from?.id ?? "—"}</code>\n\nاین عدد را در فایل <code>.env</code> مقابل <code>ADMIN_TELEGRAM_IDS</code> قرار دهید تا پنل مدیریت فعال شود.`,
      { parse_mode: "HTML" },
    );
  });

  bot.command("contact", async (ctx) => {
    await ctx.reply(contactText(), { parse_mode: "HTML", reply_markup: homeRow() });
  });

  bot.callbackQuery("menu:home", async (ctx) => {
    await answer(ctx);
    ctx.session.draft = null;
    ctx.session.adminAction = null;
    ctx.session.calc = null;
    ctx.session.support = null;
    ctx.session.replyTo = null;
    await editOrSend(ctx, welcomeText(ctx.from?.first_name), {
      parse_mode: "HTML",
      reply_markup: mainMenu(),
    });
  });

  bot.callbackQuery("menu:about", async (ctx) => {
    await answer(ctx);
    await editOrSend(ctx, aboutText, {
      parse_mode: "HTML",
      reply_markup: homeRow(),
    });
  });

  bot.callbackQuery("menu:contact", async (ctx) => {
    await answer(ctx);
    await editOrSend(ctx, contactText(), {
      parse_mode: "HTML",
      reply_markup: homeRow(),
    });
  });

  bot.callbackQuery("menu:channel", async (ctx) => {
    await answer(ctx);
    await editOrSend(
      ctx,
      `📣 <b>کانال رسمی ${env.brandName}</b>\n\nنمونه‌کارها، نکات طراحی و پیشنهادهای ویژه را در کانال ما ببینید.\n\n${env.channelUrl}`,
      {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        reply_markup: homeRow(),
      },
    );
  });

  bot.callbackQuery("menu:faq", async (ctx) => {
    await answer(ctx);
    await editOrSend(ctx, "❓ <b>سوالات متداول</b>\n\nروی هر سوال بزنید تا پاسخ آن را ببینید:", {
      parse_mode: "HTML",
      reply_markup: faqListKeyboard(),
    });
  });

  bot.callbackQuery(/^faq:(\d+)$/, async (ctx) => {
    const index = Number(ctx.match[1]);
    const item = faq[index];
    await answer(ctx);
    if (!item) {
      await editOrSend(ctx, "این سوال پیدا نشد.", { reply_markup: faqListKeyboard() });
      return;
    }
    await editOrSend(
      ctx,
      `❓ <b>${escapeHtml(item.question)}</b>\n\n${escapeHtml(item.answer)}`,
      {
        parse_mode: "HTML",
        reply_markup: faqListKeyboard(),
      },
    );
  });
}
