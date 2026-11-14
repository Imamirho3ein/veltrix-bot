import type { Context, InlineKeyboard } from "grammy";
import type { OrderStatus } from "./types.js";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "در انتظار بررسی",
  REVIEWING: "در حال بررسی",
  CONTACTED: "تماس گرفته شده",
  IN_PROGRESS: "در حال اجرا",
  DELIVERED: "تحویل شده",
  CANCELLED: "لغو شده",
};

export const STATUS_ICONS: Record<OrderStatus, string> = {
  PENDING: "🕓",
  REVIEWING: "🔍",
  CONTACTED: "📞",
  IN_PROGRESS: "⚙️",
  DELIVERED: "✅",
  CANCELLED: "❌",
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fa-IR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  });
}

export function statusLine(status: OrderStatus): string {
  return `${STATUS_ICONS[status]} ${STATUS_LABELS[status]}`;
}

const STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "REVIEWING",
  "CONTACTED",
  "IN_PROGRESS",
  "DELIVERED",
];

export function progressBar(status: OrderStatus): string {
  if (status === "CANCELLED") return "▰▱▱▱▱ (لغو شده)";
  const index = STATUS_FLOW.indexOf(status);
  return STATUS_FLOW.map((_, position) => (position <= index ? "▰" : "▱")).join("");
}

export function formatMillion(value: number): string {
  return `${Math.max(0, Math.round(value)).toLocaleString("fa-IR")} میلیون تومان`;
}

export interface MessageExtra {
  parse_mode?: "HTML";
  reply_markup?: InlineKeyboard;
  link_preview_options?: { is_disabled?: boolean };
}

export async function editOrSend(
  ctx: Context,
  text: string,
  extra: MessageExtra = { parse_mode: "HTML" },
): Promise<void> {
  try {
    await ctx.editMessageText(text, extra);
  } catch {
    await ctx.reply(text, extra);
  }
}

export async function answer(ctx: Context, text?: string, showAlert = false): Promise<void> {
  try {
    await ctx.answerCallbackQuery({ text, show_alert: showAlert });
  } catch {
    // Expired query — nothing useful to do.
  }
}

export function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
