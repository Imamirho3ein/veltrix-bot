import { Keyboard, type Bot } from "grammy";
import type { BotContext, OrderDraft } from "../session.js";
import { newDraft } from "../session.js";
import { addons, budgetOptions, sitePlans } from "../data.js";
import {
  budgetKeyboard,
  briefKeyboard,
  confirmOrderKeyboard,
  mainMenu,
  orderServicesKeyboard,
  planKeyboard,
} from "../keyboards.js";
import { createOrder } from "../store.js";
import { notifyAdminsNewOrder } from "../notify.js";
import { answer, editOrSend, escapeHtml } from "../ui.js";

function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function planLabelFor(draft: OrderDraft): string {
  return draft.planLabel ?? "—";
}

function summaryText(draft: OrderDraft): string {
  return `🧾 <b>پیش‌فاکتور سفارش</b>

🎨 خدمت: <b>${escapeHtml(draft.serviceTitle ?? "—")}</b>
💎 پلن: ${escapeHtml(planLabelFor(draft))}
👤 نام: ${escapeHtml(draft.name ?? "—")}
📱 تلفن: ${escapeHtml(draft.phone ?? "—")}
💰 بودجه: ${escapeHtml(draft.budget || "هنوز مشخص نیست")}
📎 بریف: ${draft.brief ? "فایل پیوست شده" : "بدون فایل"}

📝 توضیحات:
${escapeHtml(draft.description ?? "—")}

آیا اطلاعات بالا درست است؟ با تأیید، سفارش شما ثبت می‌شود و همکاران ما تماس می‌گیرند.`;
}

async function askName(ctx: BotContext): Promise<void> {
  if (ctx.session.draft) ctx.session.draft.step = "name";
  await ctx.reply(
    "👤 نام و نام خانوادگی خود را بنویسید:\n\n(برای انصراف /cancel را بزنید)",
  );
}

async function askPhone(ctx: BotContext): Promise<void> {
  if (ctx.session.draft) ctx.session.draft.step = "phone";
  await ctx.reply("📱 شمارهٔ تماس خود را بنویسید یا با دکمهٔ زیر ارسال کنید:", {
    reply_markup: new Keyboard().requestContact("📱 ارسال شمارهٔ من").resized().oneTime(),
  });
}

async function askDescription(ctx: BotContext): Promise<void> {
  if (ctx.session.draft) ctx.session.draft.step = "description";
  await ctx.reply(
    "📝 کمی دربارهٔ پروژه بنویسید:\nهدف سایت، مخاطب، صفحات موردنیاز و هر نکتهٔ مهم دیگر.\n\n(برای انصراف /cancel را بزنید)",
    { reply_markup: { remove_keyboard: true } },
  );
}

async function askBrief(ctx: BotContext): Promise<void> {
  if (ctx.session.draft) ctx.session.draft.step = "brief";
  await ctx.reply(
    "📎 اگر بریف، لوگو، عکس یا فایل نمونه‌کار دارید همین‌جا بفرستید.\nدر غیر این صورت «بدون فایل» را بزنید.",
    { reply_markup: briefKeyboard() },
  );
}

async function askBudget(ctx: BotContext): Promise<void> {
  if (ctx.session.draft) ctx.session.draft.step = "budget";
  await ctx.reply("💰 بودجهٔ تقریبی پروژه را انتخاب کنید:", {
    reply_markup: budgetKeyboard(),
  });
}

async function startConsult(ctx: BotContext): Promise<void> {
  ctx.session.draft = newDraft({
    serviceSlug: "consult",
    serviceTitle: "مشاوره و تعیین نوع پروژه",
    plan: "consult",
    planLabel: "مشاورهٔ رایگان",
  });
  await askName(ctx);
}

/** Start the order form from another handler (calculator, portfolio, …). */
export async function startOrderDraft(
  ctx: BotContext,
  input: {
    serviceSlug: string;
    serviceTitle: string;
    planLabel: string;
    source?: string;
  },
): Promise<void> {
  ctx.session.calc = null;
  ctx.session.support = null;
  ctx.session.draft = newDraft({
    serviceSlug: input.serviceSlug,
    serviceTitle: input.serviceTitle,
    plan: "custom",
    planLabel: input.planLabel,
  });
  await askName(ctx);
}

export function registerOrder(bot: Bot<BotContext>): void {
  bot.command("order", async (ctx) => {
    ctx.session.calc = null;
    ctx.session.support = null;
    ctx.session.draft = newDraft();
    await ctx.reply("🚀 <b>ثبت سفارش جدید</b>\n\nنوع سایت یا خدمتی که می‌خواهید را انتخاب کنید:", {
      parse_mode: "HTML",
      reply_markup: orderServicesKeyboard(),
    });
  });

  bot.callbackQuery("menu:order", async (ctx) => {
    await answer(ctx);
    ctx.session.calc = null;
    ctx.session.support = null;
    ctx.session.draft = newDraft();
    await editOrSend(ctx, "🚀 <b>ثبت سفارش جدید</b>\n\nنوع سایت یا خدمتی که می‌خواهید را انتخاب کنید:", {
      parse_mode: "HTML",
      reply_markup: orderServicesKeyboard(),
    });
  });

  bot.callbackQuery("menu:consult", async (ctx) => {
    await answer(ctx);
    await startConsult(ctx);
  });

  bot.callbackQuery(/^osvc:(.+)$/, async (ctx) => {
    const slug = ctx.match[1]!;
    await answer(ctx);

    if (slug === "none") {
      await startConsult(ctx);
      return;
    }

    const plan = sitePlans.find((item) => item.slug === slug);
    if (!plan) {
      await editOrSend(ctx, "این خدمت پیدا نشد.", { reply_markup: orderServicesKeyboard() });
      return;
    }

    ctx.session.draft = newDraft({
      serviceSlug: plan.slug,
      serviceTitle: plan.title,
    });

    const price = plan.templateRange
      ? `🧱 قالب آماده: ${plan.templateRange}\n💎 ${plan.customLabel}: ${plan.customPrice}`
      : `💎 ${plan.customLabel}: ${plan.customPrice}`;

    await editOrSend(
      ctx,
      `${plan.emoji} <b>${escapeHtml(plan.title)}</b>\n\n${price}\n\nکدام پلن را می‌خواهید؟`,
      { parse_mode: "HTML", reply_markup: planKeyboard(plan.slug) },
    );
  });

  bot.callbackQuery(/^plan:(template|custom|consult):([a-z-]+)$/, async (ctx) => {
    const key = ctx.match[1] as "template" | "custom" | "consult";
    const slug = ctx.match[2]!;
    const plan = sitePlans.find((item) => item.slug === slug);
    const draft = ctx.session.draft;
    if (!plan || !draft) {
      await answer(ctx, "جلسه منقضی شده است. لطفاً دوباره شروع کنید.", true);
      await editOrSend(ctx, "لطفاً از منوی اصلی دوباره شروع کنید.", {
        reply_markup: mainMenu(),
      });
      return;
    }

    draft.serviceSlug = plan.slug;
    draft.serviceTitle = plan.title;
    draft.plan = key;

    if (key === "consult") {
      draft.planLabel = "مشاوره / تعیین پلن مناسب";
    } else if (key === "template") {
      draft.planLabel = `قالب آماده (${plan.templateRange ?? "استعلام"})`;
    } else {
      draft.planLabel = `${plan.customLabel} — ${plan.customPrice}`;
    }

    await answer(ctx);
    await askName(ctx);
  });

  bot.callbackQuery(/^oaddon:([a-z-]+)$/, async (ctx) => {
    const addon = addons.find((item) => item.slug === ctx.match[1]);
    if (!addon) {
      await answer(ctx, "این خدمت پیدا نشد.", true);
      return;
    }
    ctx.session.draft = newDraft({
      serviceSlug: `addon-${addon.slug}`,
      serviceTitle: `خدمات تکمیلی: ${addon.title}`,
      plan: "consult",
      planLabel: "استعلام قیمت",
    });
    await answer(ctx);
    await askName(ctx);
  });

  bot.callbackQuery("order:skipbrief", async (ctx) => {
    const draft = ctx.session.draft;
    if (!draft || !draft.name) {
      await answer(ctx, "جلسه منقضی شده است.", true);
      return;
    }
    draft.brief = undefined;
    await answer(ctx, "بدون فایل ادامه می‌دهیم.");
    await askBudget(ctx);
  });

  bot.callbackQuery("budget:skip", async (ctx) => {
    const draft = ctx.session.draft;
    if (!draft) {
      await answer(ctx, "جلسه منقضی شده است.", true);
      return;
    }
    draft.budget = "هنوز مشخص نیست";
    draft.step = null;
    await answer(ctx);
    await editOrSend(ctx, summaryText(draft), {
      parse_mode: "HTML",
      reply_markup: confirmOrderKeyboard(),
    });
  });

  bot.callbackQuery(/^budget:(\d+)$/, async (ctx) => {
    const draft = ctx.session.draft;
    const option = budgetOptions[Number(ctx.match[1])];
    if (!draft || !option) {
      await answer(ctx, "جلسه منقضی شده است.", true);
      return;
    }
    draft.budget = option;
    draft.step = null;
    await answer(ctx);
    await editOrSend(ctx, summaryText(draft), {
      parse_mode: "HTML",
      reply_markup: confirmOrderKeyboard(),
    });
  });

  bot.callbackQuery("order:cancel", async (ctx) => {
    ctx.session.draft = null;
    await answer(ctx, "سفارش لغو شد.");
    await ctx.reply("✖️ سفارش لغو شد. هر وقت خواستید دوباره شروع کنید.", {
      reply_markup: { remove_keyboard: true },
    });
    await ctx.reply("منوی اصلی:", { reply_markup: mainMenu() });
  });

  bot.callbackQuery("order:confirm", async (ctx) => {
    const draft = ctx.session.draft;
    if (!draft || !draft.name || !draft.phone || !draft.serviceTitle) {
      await answer(ctx, "اطلاعات سفارش کامل نیست. لطفاً دوباره شروع کنید.", true);
      return;
    }
    const from = ctx.from;
    if (!from) {
      await answer(ctx, "خطا در شناسایی کاربر.", true);
      return;
    }

    await answer(ctx, "در حال ثبت سفارش…");

    const order = await createOrder({
      telegramId: from.id,
      username: from.username,
      name: draft.name,
      phone: draft.phone,
      serviceSlug: draft.serviceSlug ?? "unknown",
      serviceTitle: draft.serviceTitle,
      planLabel: planLabelFor(draft),
      budget: draft.budget || "هنوز مشخص نیست",
      description: draft.description ?? "—",
      brief: draft.brief,
      source: "bot",
    });

    ctx.session.draft = null;

    await ctx.reply(
      `✅ <b>سفارش شما با موفقیت ثبت شد!</b>

🔖 کد پیگیری: <code>${order.reference}</code>
🎨 خدمت: ${escapeHtml(order.serviceTitle)}
💎 پلن: ${escapeHtml(order.planLabel)}

همکاران ما در کمتر از ۲۴ ساعت کاری با شما تماس می‌گیرند. برای مشاهدهٔ وضعیت، از «📁 سفارش‌های من» استفاده کنید.`,
      { parse_mode: "HTML", reply_markup: mainMenu() },
    );

    await notifyAdminsNewOrder(bot, order);
  });

  bot.on("message:contact", async (ctx, next) => {
    const draft = ctx.session.draft;
    if (!draft || draft.step !== "phone") {
      await next();
      return;
    }
    draft.phone = normalizeDigits(ctx.message.contact.phone_number);
    await askDescription(ctx);
  });

  bot.on(["message:photo", "message:document"], async (ctx, next) => {
    const draft = ctx.session.draft;
    if (!draft || draft.step !== "brief") {
      await next();
      return;
    }
    if (ctx.message.photo) {
      const largest = ctx.message.photo[ctx.message.photo.length - 1]!;
      draft.brief = { fileId: largest.file_id, kind: "photo" };
    } else if (ctx.message.document) {
      draft.brief = {
        fileId: ctx.message.document.file_id,
        kind: "document",
        fileName: ctx.message.document.file_name,
      };
    }
    draft.step = null;
    await ctx.reply("✅ فایل بریف ثبت شد.");
    await askBudget(ctx);
  });

  bot.on("message:text", async (ctx, next) => {
    const draft = ctx.session.draft;
    if (!draft || !draft.step) {
      await next();
      return;
    }
    const text = ctx.message.text.trim();
    if (text.startsWith("/")) {
      await next();
      return;
    }

    if (draft.step === "name") {
      if (text.length < 3) {
        await ctx.reply("نام باید حداقل ۳ حرف باشد. لطفاً دوباره بنویسید:");
        return;
      }
      draft.name = text.slice(0, 80);
      await askPhone(ctx);
      return;
    }

    if (draft.step === "phone") {
      const normalized = normalizeDigits(text).replace(/[\s()-]/g, "");
      if (!/^\+?\d{8,15}$/.test(normalized)) {
        await ctx.reply("شمارهٔ واردشده معتبر نیست. نمونهٔ درست: ۰۹۱۲۱۲۳۴۵۶۷");
        return;
      }
      draft.phone = normalized;
      await askDescription(ctx);
      return;
    }

    if (draft.step === "description") {
      if (text.length < 5) {
        await ctx.reply("لطفاً کمی بیشتر توضیح دهید (حداقل ۵ حرف):");
        return;
      }
      draft.description = text.slice(0, 1500);
      await askBrief(ctx);
      return;
    }

    if (draft.step === "brief") {
      await ctx.reply("لطفاً یک عکس یا فایل بفرستید، یا «بدون فایل» را بزنید.", {
        reply_markup: briefKeyboard(),
      });
      return;
    }

    if (draft.step === "budget") {
      draft.budget = text.slice(0, 80);
      draft.step = null;
      await ctx.reply(summaryText(draft), {
        parse_mode: "HTML",
        reply_markup: confirmOrderKeyboard(),
      });
      return;
    }

    await next();
  });
}
