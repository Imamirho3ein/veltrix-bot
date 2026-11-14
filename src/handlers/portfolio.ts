import type { Bot } from "grammy";
import type { BotContext } from "../session.js";
import { portfolio, testimonials } from "../data.js";
import { portfolioItemKeyboard, portfolioKeyboard } from "../keyboards.js";
import { answer, editOrSend, escapeHtml } from "../ui.js";

function listText(): string {
  const highlights = testimonials
    .slice(0, 2)
    .map(
      (item) =>
        `💬 «${escapeHtml(item.comment.split(".")[0] ?? item.comment)}»\n— ${escapeHtml(item.role)}`,
    )
    .join("\n\n");

  return `🖼 <b>نمونه‌کارهای ${escapeHtml("VELTRIX STUDIO")}</b>

بخشی از پروژه‌هایی که با هم ساختیم. روی هر مورد بزنید تا جزئیات، خدمات و نتایج را ببینید.

${highlights}`;
}

function itemText(slug: string): string | null {
  const item = portfolio.find((project) => project.slug === slug);
  if (!item) return null;
  const results = item.results
    .map((result) => `• ${escapeHtml(result.label)}: <b>${escapeHtml(result.value)}</b>`)
    .join("\n");
  return `🖼 <b>${escapeHtml(item.titleFa)}</b> — ${escapeHtml(item.title)}
دسته: ${escapeHtml(item.category)}
⏱ مدت پروژه: ${item.timeline}

${escapeHtml(item.summary)}

🧩 خدمات: ${item.services.map(escapeHtml).join("، ")}

📈 نتایج
${results}`;
}

export function registerPortfolio(bot: Bot<BotContext>): void {
  const showList = async (ctx: BotContext) => {
    await editOrSend(ctx, listText(), {
      parse_mode: "HTML",
      reply_markup: portfolioKeyboard(),
    });
  };

  bot.command("portfolio", async (ctx) => {
    await ctx.reply(listText(), {
      parse_mode: "HTML",
      reply_markup: portfolioKeyboard(),
    });
  });

  bot.callbackQuery("menu:portfolio", async (ctx) => {
    await answer(ctx);
    await showList(ctx);
  });

  bot.callbackQuery(/^pf:([a-z-]+)$/, async (ctx) => {
    const slug = ctx.match[1]!;
    const text = itemText(slug);
    if (!text) {
      await answer(ctx, "این نمونه‌کار پیدا نشد.", true);
      return;
    }
    await answer(ctx);
    await editOrSend(ctx, text, {
      parse_mode: "HTML",
      reply_markup: portfolioItemKeyboard(slug),
    });
  });
}
