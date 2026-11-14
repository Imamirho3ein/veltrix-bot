import type { Bot } from "grammy";
import type { BotContext } from "../session.js";
import type { CalculatorState } from "../session.js";
import { calcOptions, pageOptions, planPrices, sitePlans } from "../data.js";
import {
  calculatorDesignKeyboard,
  calculatorOptionsKeyboard,
  calculatorPagesKeyboard,
  calculatorResultKeyboard,
  calculatorTypesKeyboard,
  mainMenu,
} from "../keyboards.js";
import { answer, editOrSend, escapeHtml, formatMillion } from "../ui.js";
import { startOrderDraft } from "./order.js";

function freshCalc(): CalculatorState {
  return { step: "type", options: [] };
}

function planTitle(slug: string | undefined): string {
  const plan = sitePlans.find((item) => item.slug === slug);
  return plan ? `${plan.emoji} ${plan.title}` : "—";
}

function estimate(calc: CalculatorState): { low: number; high: number } | null {
  if (!calc.typeSlug || !calc.design) return null;
  const price = planPrices[calc.typeSlug];
  if (!price) return null;
  const base =
    calc.design === "template" ? (price.template ?? price.custom) : price.custom;
  const pages = pageOptions.find((item) => item.key === calc.pages);
  const percent = calc.options.reduce(
    (sum, key) => sum + (calcOptions.find((item) => item.key === key)?.percent ?? 0),
    0,
  );
  const low = base * (pages?.factor ?? 1) * (1 + percent);
  const round = (value: number) => Math.round(value / 5) * 5;
  return { low: round(low), high: round(low * 1.25) };
}

function summaryLine(calc: CalculatorState): string {
  const design = calc.design === "template" ? "قالب آماده" : "طرح اختصاصی";
  const pages = pageOptions.find((item) => item.key === calc.pages)?.label ?? "—";
  const options = calc.options.length
    ? calc.options
        .map((key) => calcOptions.find((item) => item.key === key)?.label ?? key)
        .join("، ")
    : "بدون گزینهٔ اضافه";
  return `نوع سایت: ${planTitle(calc.typeSlug)}
نوع طراحی: ${design}
حجم: ${pages}
گزینه‌ها: ${options}`;
}

function resultText(calc: CalculatorState): string {
  const result = estimate(calc);
  return `🧮 <b>برآورد قیمت پروژه</b>

${summaryLine(calc)}

💰 برآورد: <b>${formatMillion(result?.low ?? 0)}</b> تا <b>${formatMillion(result?.high ?? 0)}</b>

⚠️ این عدد تقریبی است و بر اساس تعرفهٔ پایه محاسبه شده. قیمت نهایی بعد از جلسهٔ کشف و مشخص‌شدن دقیق امکانات اعلام می‌شود.`;
}

async function render(
  ctx: BotContext,
  text: string,
  markup: ReturnType<typeof calculatorTypesKeyboard>,
): Promise<void> {
  await editOrSend(ctx, text, { parse_mode: "HTML", reply_markup: markup });
}

export function registerCalculator(bot: Bot<BotContext>): void {
  bot.callbackQuery("menu:calc", async (ctx) => {
    ctx.session.calc = freshCalc();
    await answer(ctx);
    await render(
      ctx,
      "🧮 <b>محاسبهٔ قیمت</b>\n\nدر سه قدم برآورد هزینهٔ پروژه‌تان را بگیرید.\n\n۱️⃣ نوع سایت را انتخاب کنید:",
      calculatorTypesKeyboard(),
    );
  });

  bot.command("calc", async (ctx) => {
    ctx.session.calc = freshCalc();
    await ctx.reply("🧮 <b>محاسبهٔ قیمت</b>\n\nنوع سایت را انتخاب کنید:", {
      parse_mode: "HTML",
      reply_markup: calculatorTypesKeyboard(),
    });
  });

  bot.callbackQuery(/^calc:type:([a-z-]+)$/, async (ctx) => {
    const slug = ctx.match[1]!;
    const plan = sitePlans.find((item) => item.slug === slug);
    if (!plan) {
      await answer(ctx, "این نوع سایت پیدا نشد.", true);
      return;
    }
    ctx.session.calc = { step: "design", typeSlug: slug, options: [] };
    await answer(ctx);
    await render(
      ctx,
      `🧮 <b>محاسبهٔ قیمت</b>\n\nنوع انتخاب‌شده: ${plan.emoji} ${escapeHtml(plan.title)}\n\n۲️⃣ نوع طراحی را انتخاب کنید:`,
      calculatorDesignKeyboard(slug),
    );
  });

  bot.callbackQuery(/^calc:design:(template|custom)$/, async (ctx) => {
    const calc = ctx.session.calc;
    if (!calc?.typeSlug) {
      await answer(ctx, "لطفاً از ابتدا شروع کنید.", true);
      return;
    }
    calc.design = ctx.match[1] as "template" | "custom";
    calc.step = "pages";
    await answer(ctx);
    await render(
      ctx,
      `🧮 <b>محاسبهٔ قیمت</b>\n\n${escapeHtml(planTitle(calc.typeSlug))}\n\n۳️⃣ حجم پروژه را انتخاب کنید:`,
      calculatorPagesKeyboard(),
    );
  });

  bot.callbackQuery(/^calc:pages:([0-9+-]+)$/, async (ctx) => {
    const calc = ctx.session.calc;
    const key = ctx.match[1]!;
    if (!calc) {
      await answer(ctx, "لطفاً از ابتدا شروع کنید.", true);
      return;
    }
    if (!pageOptions.some((item) => item.key === key)) {
      await answer(ctx, "گزینهٔ نامعتبر.", true);
      return;
    }
    calc.pages = key;
    calc.step = "options";
    await answer(ctx);
    await render(
      ctx,
      `🧮 <b>محاسبهٔ قیمت</b>\n\n${escapeHtml(summaryLine(calc))}\n\n۴️⃣ گزینه‌های اضافه را انتخاب کنید (چندتایی):`,
      calculatorOptionsKeyboard(calc.options),
    );
  });

  bot.callbackQuery(/^calc:opt:([a-z]+)$/, async (ctx) => {
    const calc = ctx.session.calc;
    if (!calc) {
      await answer(ctx, "لطفاً از ابتدا شروع کنید.", true);
      return;
    }
    const key = ctx.match[1]!;
    if (!calcOptions.some((item) => item.key === key)) {
      await answer(ctx, "گزینهٔ نامعتبر.", true);
      return;
    }
    calc.options = calc.options.includes(key)
      ? calc.options.filter((item) => item !== key)
      : [...calc.options, key];
    await answer(ctx);
    await render(
      ctx,
      `🧮 <b>محاسبهٔ قیمت</b>\n\n${escapeHtml(summaryLine(calc))}\n\n۴️⃣ گزینه‌های اضافه را انتخاب کنید (چندتایی):`,
      calculatorOptionsKeyboard(calc.options),
    );
  });

  bot.callbackQuery("calc:result", async (ctx) => {
    const calc = ctx.session.calc;
    if (!calc?.typeSlug || !calc.design || !calc.pages) {
      await answer(ctx, "لطفاً همهٔ مراحل را کامل کنید.", true);
      return;
    }
    await answer(ctx);
    await render(ctx, resultText(calc), calculatorResultKeyboard());
  });

  bot.callbackQuery("calc:order", async (ctx) => {
    const calc = ctx.session.calc;
    const result = calc ? estimate(calc) : null;
    if (!calc?.typeSlug || !calc.design || !result) {
      await answer(ctx, "لطفاً محاسبه را کامل کنید.", true);
      return;
    }
    const plan = sitePlans.find((item) => item.slug === calc.typeSlug);
    const planLabel = `${calc.design === "template" ? "قالب آماده" : "طرح اختصاصی"} — برآورد ${formatMillion(result.low)} تا ${formatMillion(result.high)}`;
    await answer(ctx);
    await startOrderDraft(ctx, {
      serviceSlug: calc.typeSlug,
      serviceTitle: plan?.title ?? "طراحی سایت",
      planLabel,
    });
  });

  bot.callbackQuery("calc:back:type", async (ctx) => {
    const calc = ctx.session.calc ?? freshCalc();
    calc.step = "type";
    ctx.session.calc = calc;
    await answer(ctx);
    await render(
      ctx,
      "🧮 <b>محاسبهٔ قیمت</b>\n\n۱️⃣ نوع سایت را انتخاب کنید:",
      calculatorTypesKeyboard(calc.typeSlug),
    );
  });

  bot.callbackQuery("calc:back:design", async (ctx) => {
    const calc = ctx.session.calc;
    if (!calc?.typeSlug) {
      await answer(ctx, "لطفاً از ابتدا شروع کنید.", true);
      return;
    }
    calc.step = "design";
    await answer(ctx);
    await render(
      ctx,
      `🧮 <b>محاسبهٔ قیمت</b>\n\nنوع انتخاب‌شده: ${escapeHtml(planTitle(calc.typeSlug))}\n\n۲️⃣ نوع طراحی را انتخاب کنید:`,
      calculatorDesignKeyboard(calc.typeSlug),
    );
  });

  bot.callbackQuery("calc:back:pages", async (ctx) => {
    const calc = ctx.session.calc;
    if (!calc?.typeSlug) {
      await answer(ctx, "لطفاً از ابتدا شروع کنید.", true);
      return;
    }
    calc.step = "pages";
    await answer(ctx);
    await render(
      ctx,
      `🧮 <b>محاسبهٔ قیمت</b>\n\n${escapeHtml(planTitle(calc.typeSlug))}\n\n۳️⃣ حجم پروژه را انتخاب کنید:`,
      calculatorPagesKeyboard(calc.pages),
    );
  });

  bot.callbackQuery("calc:back:options", async (ctx) => {
    const calc = ctx.session.calc;
    if (!calc) {
      await answer(ctx, "لطفاً از ابتدا شروع کنید.", true);
      return;
    }
    calc.step = "options";
    await answer(ctx);
    await render(
      ctx,
      `🧮 <b>محاسبهٔ قیمت</b>\n\n${escapeHtml(summaryLine(calc))}\n\n۴️⃣ گزینه‌های اضافه را انتخاب کنید (چندتایی):`,
      calculatorOptionsKeyboard(calc.options),
    );
  });

  bot.callbackQuery("calc:cancel", async (ctx) => {
    ctx.session.calc = null;
    await answer(ctx, "محاسبه لغو شد.");
    await editOrSend(ctx, "محاسبهٔ قیمت لغو شد.", {
      parse_mode: "HTML",
      reply_markup: mainMenu(),
    });
  });
}
