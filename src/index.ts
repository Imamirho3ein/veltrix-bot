import { Bot, session } from "grammy";
import type { Agent } from "node:http";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
import { assertConfig, env } from "./config.js";
import { initialSession, type BotContext } from "./session.js";
import { fileSessionStorage } from "./sessionStorage.js";
import { mainMenu } from "./keyboards.js";
import { registerMenu } from "./handlers/menu.js";
import { registerCatalog } from "./handlers/catalog.js";
import { registerCalculator } from "./handlers/calculator.js";
import { registerPortfolio } from "./handlers/portfolio.js";
import { registerOrder } from "./handlers/order.js";
import { registerAccount } from "./handlers/account.js";
import { registerSupport } from "./handlers/support.js";
import { registerAdmin } from "./handlers/admin.js";
import { registerMembership } from "./membership.js";
import { startHealthServer } from "./health.js";

function createProxyAgent(proxyUrl: string): Agent {
  const agent = proxyUrl.startsWith("socks")
    ? new SocksProxyAgent(proxyUrl)
    : new HttpsProxyAgent(proxyUrl);
  return agent as unknown as Agent;
}

/** Very small flood guard: drops bursts from the same user. */
const lastMessageAt = new Map<number, number>();
const MIN_GAP_MS = 500;

async function main(): Promise<void> {
  assertConfig();
  startHealthServer();

  const bot = new Bot<BotContext>(
    env.token,
    env.proxy
      ? { client: { baseFetchConfig: { agent: createProxyAgent(env.proxy) } } }
      : undefined,
  );

  bot.use(session({ initial: initialSession, storage: fileSessionStorage() }));

  bot.use(async (ctx, next) => {
    if (ctx.message && ctx.from) {
      const now = Date.now();
      const previous = lastMessageAt.get(ctx.from.id) ?? 0;
      if (now - previous < MIN_GAP_MS) return;
      lastMessageAt.set(ctx.from.id, now);
      if (lastMessageAt.size > 2000) lastMessageAt.clear();
    }
    await next();
  });

  registerMembership(bot);

  registerMenu(bot);
  registerCatalog(bot);
  registerCalculator(bot);
  registerPortfolio(bot);
  registerOrder(bot);
  registerAccount(bot);
  registerSupport(bot);
  registerAdmin(bot);

  bot.on("message:text", async (ctx) => {
    if (ctx.chat.type !== "private") return;
    await ctx.reply("برای شروع، از منوی زیر استفاده کنید یا /start را بزنید:", {
      reply_markup: mainMenu(),
    });
  });

  bot.catch(async ({ ctx, error }) => {
    console.error("[bot] handler error", error);
    try {
      if (ctx.callbackQuery) {
        await ctx.answerCallbackQuery({
          text: "خطایی رخ داد. لطفاً دوباره تلاش کنید.",
          show_alert: true,
        });
      } else {
        await ctx.reply("❌ خطای موقت. لطفاً دوباره تلاش کنید.");
      }
    } catch {
      // Nothing else we can do for this update.
    }
  });

  try {
    await bot.api.setMyCommands([
      { command: "start", description: "منوی اصلی" },
      { command: "services", description: "خدمات و تعرفه" },
      { command: "calc", description: "محاسبهٔ قیمت" },
      { command: "portfolio", description: "نمونه‌کارها" },
      { command: "order", description: "ثبت سفارش" },
      { command: "orders", description: "سفارش‌های من" },
      { command: "support", description: "پشتیبانی" },
      { command: "contact", description: "راه‌های تماس" },
      { command: "myid", description: "شناسهٔ تلگرام من" },
      { command: "cancel", description: "لغو عملیات جاری" },
    ]);
  } catch (error) {
    console.warn("[bot] could not register command list", error);
  }

  process.once("SIGINT", () => void bot.stop());
  process.once("SIGTERM", () => void bot.stop());

  console.log(`[bot] starting ${env.brandName} bot (long polling)…`);
  await bot.start({
    onStart: (info) => console.log(`[bot] @${info.username} is up and running.`),
  });
}

void main().catch((error) => {
  console.error("[bot] fatal error:", error);
  process.exit(1);
});
