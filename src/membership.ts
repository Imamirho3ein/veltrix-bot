import type { Bot } from "grammy";
import type { BotContext } from "./session.js";
import { env } from "./config.js";
import { isAdmin, recordReferral } from "./store.js";
import { joinKeyboard, mainMenu } from "./keyboards.js";
import { welcomeText } from "./handlers/menu.js";
import { notifyAdminsNewReferral } from "./notify.js";
import { answer, editOrSend, escapeHtml } from "./ui.js";

const CACHE_TTL_MS = 60_000;

/** userId → membership result, so we don't call the API on every tap. */
const memberCache = new Map<number, { member: boolean; at: number }>();

function membershipText(): string {
  return `🔒 <b>عضویت در کانال الزامی است</b>

برای استفاده از خدمات <b>${escapeHtml(env.brandName)}</b> ابتدا در کانال رسمی ما عضو شوید:

${env.channelUrl}

بعد از عضویت، روی «✅ عضو شدم» بزنید. اگر عضو بودید و باز هم این پیام را دیدید، چند ثانیه صبر کنید و دوباره تلاش کنید.`;
}

/**
 * Checks whether a user is a member of the configured channel.
 * Fails open: if Telegram returns an error (bot not admin yet, network issue, …)
 * we don't want to lock every customer out of the bot.
 */
export async function isChannelMember(
  bot: Bot<BotContext>,
  userId: number,
  options: { fresh?: boolean } = {},
): Promise<boolean> {
  if (!env.forceJoin || !env.channelId) return true;

  const now = Date.now();
  const cached = memberCache.get(userId);
  if (!options.fresh && cached && now - cached.at < CACHE_TTL_MS) {
    return cached.member;
  }

  try {
    const member = await bot.api.getChatMember(env.channelId, userId);
    const allowed =
      member.status === "creator" ||
      member.status === "administrator" ||
      member.status === "member" ||
      (member.status === "restricted" && member.is_member);
    memberCache.set(userId, { member: allowed, at: now });
    return allowed;
  } catch (error) {
    console.warn(
      `[bot] getChatMember failed for ${userId} in ${env.channelId}; allowing access`,
      error,
    );
    memberCache.set(userId, { member: true, at: now });
    return true;
  }
}

export function registerMembership(bot: Bot<BotContext>): void {
  // Guard: private chats only, admins bypass, join check skipped for the
  // "check:join" button so it can verify the fresh state itself.
  bot.use(async (ctx, next) => {
    if (!env.forceJoin || !env.channelId) return next();
    if (!ctx.chat || ctx.chat.type !== "private") return next();

    const from = ctx.from;
    if (!from || from.is_bot) return next();
    if (!ctx.message && !ctx.callbackQuery) return next();
    if (ctx.callbackQuery?.data === "check:join") return next();

    // Deep-link referral capture (ads campaigns). Runs before the join gate so
    // the lead is recorded even when the user still has to join the channel.
    const referralPayload = ctx.message?.text?.match(/^\/start\s+(ads_[\w-]+)\s*$/i)?.[1];
    if (referralPayload && from) {
      try {
        const { isFirst, totalForPayload } = await recordReferral(referralPayload.toLowerCase(), {
          id: from.id,
          username: from.username,
          first_name: from.first_name,
        });
        if (isFirst) {
          await notifyAdminsNewReferral(
            bot,
            {
              payload: referralPayload.toLowerCase(),
              telegramId: from.id,
              username: from.username,
              firstName: from.first_name,
              createdAt: new Date().toISOString(),
            },
            totalForPayload,
          );
        }
      } catch (error) {
        console.warn("[bot] could not record referral", error);
      }
    }

    if (await isAdmin(from.id)) return next();
    if (await isChannelMember(bot, from.id)) return next();

    console.log(
      `[bot] join gate blocked ${from.id}${from.username ? ` (@${from.username})` : ""}`,
    );

    if (ctx.callbackQuery) {
      await answer(ctx, "🔒 برای استفاده از ربات ابتدا در کانال عضو شوید.", true);
    }
    await ctx.reply(membershipText(), {
      parse_mode: "HTML",
      reply_markup: joinKeyboard(),
      link_preview_options: { is_disabled: true },
    });
  });

  bot.callbackQuery("check:join", async (ctx) => {
    const from = ctx.from;
    if (!from) {
      await answer(ctx);
      return;
    }

    const member = await isChannelMember(bot, from.id, { fresh: true });
    if (!member) {
      await answer(ctx, "❌ هنوز عضویت شما تأیید نشد. لطفاً اول عضو شوید.", true);
      await editOrSend(ctx, membershipText(), {
        parse_mode: "HTML",
        reply_markup: joinKeyboard(),
        link_preview_options: { is_disabled: true },
      });
      return;
    }

    await answer(ctx, "✅ عضویت تأیید شد.");
    ctx.session.draft = null;
    ctx.session.adminAction = null;
    ctx.session.calc = null;
    ctx.session.support = null;
    ctx.session.replyTo = null;
    await editOrSend(ctx, welcomeText(from.first_name), {
      parse_mode: "HTML",
      reply_markup: mainMenu(),
    });
  });

  // Admin diagnostic: shows the gate configuration and a preview of exactly
  // what non-members see. Useful when "the gate looks like it isn't working".
  bot.command("gate", async (ctx) => {
    const from = ctx.from;
    if (!from) return;
    if (!(await isAdmin(from.id))) {
      await ctx.reply("⛔️ این دستور فقط برای مدیران است.");
      return;
    }

    let botRole = "نامشخص";
    if (env.channelId) {
      try {
        const member = await bot.api.getChatMember(env.channelId, ctx.me.id);
        botRole =
          member.status === "creator"
            ? "سازنده (creator)"
            : member.status === "administrator"
              ? "ادمین (administrator)"
              : member.status;
      } catch (error) {
        botRole = "خطا در بررسی — ربات احتمالاً ادمین کانال نیست";
        console.warn("[bot] /gate could not read bot status", error);
      }
    }

    await ctx.reply(
      `🛡 <b>وضعیت عضویت اجباری</b>

فعال: <b>${env.forceJoin ? "بله" : "خیر"}</b>
کانال: <code>${escapeHtml(env.channelId || "تنظیم نشده")}</code>
نقش ربات در کانال: <b>${escapeHtml(botRole)}</b>

ℹ️ مدیران ربات از بررسی عضویت <b>معاف</b> هستند. برای دیدن رفتار واقعی، با
حسابی که در کانال عضو نیست /start را بزنید — یا پیام آزمایشی زیر را ببینید.`,
      { parse_mode: "HTML" },
    );

    await ctx.reply(membershipText(), {
      parse_mode: "HTML",
      reply_markup: joinKeyboard(),
      link_preview_options: { is_disabled: true },
    });
  });
}
