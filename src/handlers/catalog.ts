import type { Bot } from "grammy";
import type { BotContext } from "../session.js";
import { addons, sitePlans } from "../data.js";
import {
  addonDetailKeyboard,
  addonsKeyboard,
  serviceDetailKeyboard,
  servicesKeyboard,
} from "../keyboards.js";
import { answer, editOrSend, escapeHtml } from "../ui.js";

function servicesListText(): string {
  const lines = sitePlans.map(
    (plan) => `${plan.emoji} <b>${escapeHtml(plan.title)}</b>\n${escapeHtml(plan.description)}`,
  );
  return `🎨 <b>خدمات و تعرفهٔ ${escapeHtml("VELTRIX STUDIO")}</b>

${lines.join("\n\n")}

برای دیدن جزئیات، امکانات و قیمت دقیق هر مورد، روی آن بزنید.`;
}

function planText(slug: string): string | null {
  const plan = sitePlans.find((item) => item.slug === slug);
  if (!plan) return null;

  const priceLines = plan.templateRange
    ? `🧱 قالب آماده: <b>${plan.templateRange}</b>\n💎 ${plan.customLabel}: <b>${plan.customPrice}</b>`
    : `💎 ${plan.customLabel}: <b>${plan.customPrice}</b>`;

  const note = plan.note ? `\n\n📌 ${plan.note}` : "";
  const popular = plan.popular ? " ⭐ پیشنهاد محبوب مشتریان" : "";

  return `${plan.emoji} <b>${escapeHtml(plan.title)}</b>${popular}

${escapeHtml(plan.description)}

${priceLines}
⏱ زمان تقریبی: ${plan.duration}${note}

✅ <b>امکانات</b>
${plan.features.map((feature) => `• ${escapeHtml(feature)}`).join("\n")}

💡 تعرفه‌ها حدودی هستند؛ قیمت نهایی بعد از جلسهٔ کشف و مشخص‌شدن دامنهٔ کار اعلام می‌شود.`;
}

function addonsListText(): string {
  return `🧩 <b>خدمات تکمیلی</b>

${addons
  .map((addon) => `${addon.emoji} <b>${escapeHtml(addon.title)}</b>\n${escapeHtml(addon.description)}`)
  .join("\n\n")}

برای جزئیات و درخواست، روی هر مورد بزنید.`;
}

function addonText(slug: string): string | null {
  const addon = addons.find((item) => item.slug === slug);
  if (!addon) return null;
  return `${addon.emoji} <b>${escapeHtml(addon.title)}</b>

${escapeHtml(addon.description)}

✅ <b>شامل</b>
${addon.bullets.map((bullet) => `• ${escapeHtml(bullet)}`).join("\n")}

💰 تعرفه: استعلامی — بر اساس حجم پروژه اعلام می‌شود.`;
}

export function registerCatalog(bot: Bot<BotContext>): void {
  bot.command("services", async (ctx) => {
    await ctx.reply(servicesListText(), {
      parse_mode: "HTML",
      reply_markup: servicesKeyboard(),
    });
  });

  bot.command("packages", async (ctx) => {
    await ctx.reply(servicesListText(), {
      parse_mode: "HTML",
      reply_markup: servicesKeyboard(),
    });
  });

  bot.callbackQuery("menu:services", async (ctx) => {
    await answer(ctx);
    await editOrSend(ctx, servicesListText(), {
      parse_mode: "HTML",
      reply_markup: servicesKeyboard(),
    });
  });

  bot.callbackQuery(/^svc:([a-z-]+)$/, async (ctx) => {
    const text = planText(ctx.match[1]!);
    await answer(ctx);
    if (!text) {
      await editOrSend(ctx, "این خدمت پیدا نشد.", { reply_markup: servicesKeyboard() });
      return;
    }
    await editOrSend(ctx, text, {
      parse_mode: "HTML",
      reply_markup: serviceDetailKeyboard(ctx.match[1]!),
    });
  });

  bot.callbackQuery("menu:addons", async (ctx) => {
    await answer(ctx);
    await editOrSend(ctx, addonsListText(), {
      parse_mode: "HTML",
      reply_markup: addonsKeyboard(),
    });
  });

  bot.callbackQuery(/^addon:([a-z-]+)$/, async (ctx) => {
    const slug = ctx.match[1]!;
    const text = addonText(slug);
    await answer(ctx);
    if (!text) {
      await editOrSend(ctx, "این خدمت پیدا نشد.", { reply_markup: addonsKeyboard() });
      return;
    }
    await editOrSend(ctx, text, {
      parse_mode: "HTML",
      reply_markup: addonDetailKeyboard(slug),
    });
  });
}
