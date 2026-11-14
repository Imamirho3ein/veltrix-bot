import { InlineKeyboard } from "grammy";
import { addons, budgetOptions, calcOptions, faq, pageOptions, portfolio, sitePlans } from "./data.js";
import type { Order, OrderStatus } from "./types.js";
import { STATUS_ICONS, STATUS_LABELS } from "./ui.js";
import { env } from "./config.js";

export function mainMenu() {
  return new InlineKeyboard()
    .text("🎨 خدمات و تعرفه", "menu:services")
    .text("🧮 محاسبهٔ قیمت", "menu:calc")
    .row()
    .text("🚀 ثبت سفارش", "menu:order")
    .text("🖼 نمونه‌کارها", "menu:portfolio")
    .row()
    .text("📁 سفارش‌های من", "menu:myorders")
    .text("💬 پشتیبانی", "menu:support")
    .row()
    .text("❓ سوالات متداول", "menu:faq")
    .text("ℹ️ درباره ما", "menu:about")
    .row()
    .text("📣 کانال تلگرام", "menu:channel");
}

export function homeRow() {
  return new InlineKeyboard().text("🏠 منوی اصلی", "menu:home");
}

export function joinKeyboard() {
  return new InlineKeyboard()
    .url("📣 عضویت در کانال", env.channelUrl)
    .row()
    .text("✅ عضو شدم", "check:join");
}

export function cancelOnlyKeyboard() {
  return new InlineKeyboard().text("✖️ لغو", "order:cancel");
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export function servicesKeyboard() {
  const keyboard = new InlineKeyboard();
  sitePlans.forEach((plan, index) => {
    keyboard.text(`${plan.emoji} ${plan.title.replace("طراحی ", "")}`, `svc:${plan.slug}`);
    if (index % 2 === 1) keyboard.row();
  });
  if (sitePlans.length % 2 === 1) keyboard.row();
  keyboard.text("🧩 خدمات تکمیلی", "menu:addons").row();
  keyboard.text("🏠 منوی اصلی", "menu:home");
  return keyboard;
}

export function serviceDetailKeyboard(slug: string) {
  return new InlineKeyboard()
    .text("🚀 ثبت سفارش این خدمت", `osvc:${slug}`)
    .text("🧮 برآورد قیمت", `calc:type:${slug}`)
    .row()
    .text("↩️ خدمات", "menu:services")
    .text("🏠 منوی اصلی", "menu:home");
}

export function addonsKeyboard() {
  const keyboard = new InlineKeyboard();
  addons.forEach((addon, index) => {
    keyboard.text(`${addon.emoji} ${addon.title}`, `addon:${addon.slug}`);
    if (index % 2 === 1) keyboard.row();
  });
  if (addons.length % 2 === 1) keyboard.row();
  keyboard.text("↩️ خدمات", "menu:services").text("🏠 منوی اصلی", "menu:home");
  return keyboard;
}

export function addonDetailKeyboard(slug: string) {
  return new InlineKeyboard()
    .text("💬 درخواست این خدمت", `oaddon:${slug}`)
    .row()
    .text("↩️ خدمات تکمیلی", "menu:addons")
    .text("🏠 منوی اصلی", "menu:home");
}

// ---------------------------------------------------------------------------
// Price calculator
// ---------------------------------------------------------------------------

export function calculatorTypesKeyboard(selected?: string) {
  const keyboard = new InlineKeyboard();
  sitePlans.forEach((plan, index) => {
    const mark = plan.slug === selected ? "✅ " : "";
    keyboard.text(`${mark}${plan.emoji} ${plan.title.replace("طراحی ", "")}`, `calc:type:${plan.slug}`);
    if (index % 2 === 1) keyboard.row();
  });
  if (sitePlans.length % 2 === 1) keyboard.row();
  keyboard.text("✖️ لغو", "calc:cancel");
  return keyboard;
}

export function calculatorDesignKeyboard(slug: string) {
  const plan = sitePlans.find((item) => item.slug === slug);
  const keyboard = new InlineKeyboard();
  if (plan?.templateRange) {
    keyboard.text("🧱 قالب آماده", "calc:design:template").row();
  }
  keyboard.text("💎 طرح اختصاصی", "calc:design:custom").row();
  keyboard.text("↩️ نوع سایت", "calc:back:type").text("✖️ لغو", "calc:cancel");
  return keyboard;
}

export function calculatorPagesKeyboard(selected?: string) {
  const keyboard = new InlineKeyboard();
  pageOptions.forEach((option, index) => {
    const mark = option.key === selected ? "✅ " : "";
    keyboard.text(`${mark}${option.label}`, `calc:pages:${option.key}`);
    if (index % 2 === 1) keyboard.row();
  });
  if (pageOptions.length % 2 === 1) keyboard.row();
  keyboard.text("↩️ مرحله قبل", "calc:back:design").text("✖️ لغو", "calc:cancel");
  return keyboard;
}

export function calculatorOptionsKeyboard(selected: string[]) {
  const keyboard = new InlineKeyboard();
  calcOptions.forEach((option, index) => {
    const mark = selected.includes(option.key) ? "✅ " : "▫️ ";
    keyboard.text(`${mark}${option.label}`, `calc:opt:${option.key}`);
    if (index % 2 === 1) keyboard.row();
  });
  if (calcOptions.length % 2 === 1) keyboard.row();
  keyboard.text("🧮 محاسبهٔ قیمت", "calc:result").row();
  keyboard.text("↩️ مرحله قبل", "calc:back:pages").text("✖️ لغو", "calc:cancel");
  return keyboard;
}

export function calculatorResultKeyboard() {
  return new InlineKeyboard()
    .text("🚀 ثبت سفارش با این برآورد", "calc:order")
    .row()
    .text("✏️ تغییر گزینه‌ها", "calc:back:options")
    .text("🏠 منوی اصلی", "menu:home");
}

// ---------------------------------------------------------------------------
// Portfolio
// ---------------------------------------------------------------------------

export function portfolioKeyboard() {
  const keyboard = new InlineKeyboard();
  portfolio.forEach((item, index) => {
    keyboard.text(item.titleFa, `pf:${item.slug}`);
    if (index % 2 === 1) keyboard.row();
  });
  if (portfolio.length % 2 === 1) keyboard.row();
  keyboard.text("🏠 منوی اصلی", "menu:home");
  return keyboard;
}

export function portfolioItemKeyboard(slug: string) {
  return new InlineKeyboard()
    .url("🌐 مشاهده در سایت", `${env.siteUrl}/portfolio/${slug}`)
    .row()
    .text("↩️ نمونه‌کارها", "menu:portfolio")
    .text("🚀 سفارش مشابه", `osvc:${slug === "nexa-shop" || slug === "vesta" ? "ecommerce" : "corporate"}`);
}

// ---------------------------------------------------------------------------
// Order flow
// ---------------------------------------------------------------------------

export function orderServicesKeyboard() {
  const keyboard = new InlineKeyboard();
  sitePlans.forEach((plan, index) => {
    keyboard.text(`${plan.emoji} ${plan.title.replace("طراحی ", "")}`, `osvc:${plan.slug}`);
    if (index % 2 === 1) keyboard.row();
  });
  if (sitePlans.length % 2 === 1) keyboard.row();
  keyboard
    .text("🤔 مشاوره می‌خواهم", "osvc:none")
    .row()
    .text("✖️ لغو", "order:cancel");
  return keyboard;
}

export function planKeyboard(slug: string) {
  const plan = sitePlans.find((item) => item.slug === slug);
  const keyboard = new InlineKeyboard();
  if (plan?.templateRange) {
    keyboard.text("🧱 قالب آماده", `plan:template:${slug}`).row();
    keyboard.text("💎 طرح اختصاصی", `plan:custom:${slug}`).row();
  } else if (plan) {
    keyboard.text(`💎 ${plan.customLabel} — ${plan.customPrice}`, `plan:custom:${slug}`).row();
  }
  keyboard.text("🤔 مشاوره می‌خواهم", `plan:consult:${slug}`).row();
  keyboard.text("✖️ لغو", "order:cancel");
  return keyboard;
}

export function budgetKeyboard() {
  const keyboard = new InlineKeyboard();
  budgetOptions.forEach((option, index) => {
    keyboard.text(option, `budget:${index}`);
    if (index % 2 === 1) keyboard.row();
  });
  if (budgetOptions.length % 2 === 1) keyboard.row();
  keyboard.text("⏭ رد کردن", "budget:skip").row();
  keyboard.text("✖️ لغو", "order:cancel");
  return keyboard;
}

export function briefKeyboard() {
  return new InlineKeyboard()
    .text("⏭ بدون فایل، ادامه", "order:skipbrief")
    .row()
    .text("✖️ لغو سفارش", "order:cancel");
}

export function confirmOrderKeyboard() {
  return new InlineKeyboard()
    .text("✅ تأیید و ثبت سفارش", "order:confirm")
    .row()
    .text("✖️ لغو", "order:cancel");
}

// ---------------------------------------------------------------------------
// FAQ / account
// ---------------------------------------------------------------------------

export function faqListKeyboard() {
  const keyboard = new InlineKeyboard();
  faq.forEach((item, index) => {
    keyboard.text(`${index + 1}. ${item.question}`, `faq:${index}`).row();
  });
  keyboard.text("🏠 منوی اصلی", "menu:home");
  return keyboard;
}

export function myOrdersKeyboard(
  orders: { id: string; reference: string; status: OrderStatus }[],
) {
  const keyboard = new InlineKeyboard();
  orders.forEach((order) => {
    keyboard
      .text(`${STATUS_ICONS[order.status]} ${order.reference}`, `ord:${order.id}`)
      .row();
  });
  keyboard.text("🏠 منوی اصلی", "menu:home");
  return keyboard;
}

export function orderDetailKeyboard(order: Order, userId: number) {
  const keyboard = new InlineKeyboard();
  if (order.telegramId === userId) {
    if (order.status === "PENDING" || order.status === "REVIEWING") {
      keyboard.text("✖️ لغو سفارش", `ord:cancel:${order.id}`).row();
    }
    keyboard
      .text("💬 گفتگو با پشتیبانی", "menu:support")
      .row()
      .text("↩️ سفارش‌های من", "menu:myorders")
      .text("🏠 منوی اصلی", "menu:home");
  } else {
    keyboard.text("↩️ پنل مدیریت", "adm:home");
  }
  return keyboard;
}

// ---------------------------------------------------------------------------
// Support
// ---------------------------------------------------------------------------

export function supportKeyboard() {
  return new InlineKeyboard()
    .text("↩️ منوی اصلی", "menu:home")
    .row()
    .text("✖️ لغو", "support:cancel");
}

export function adminReplyKeyboard(userId: number) {
  return new InlineKeyboard()
    .text("↩️ پاسخ", `sup:r:${userId}`)
    .text("🏠 پنل", "adm:home");
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export function adminMenu() {
  return new InlineKeyboard()
    .text("📥 سفارش‌های جدید", "adm:new")
    .text("📋 همهٔ سفارش‌ها", "adm:all:0")
    .row()
    .text("📊 آمار", "adm:stats")
    .text("🔎 جستجو", "adm:find")
    .row()
    .text("📤 خروجی CSV", "adm:csv")
    .text("📣 پیام همگانی", "adm:bcast")
    .row()
    .text("🏠 منوی کاربر", "menu:home");
}

export function adminOrdersKeyboard(
  orders: { id: string; reference: string; status: OrderStatus; serviceTitle: string }[],
) {
  const keyboard = new InlineKeyboard();
  orders.forEach((order) => {
    keyboard
      .text(
        `${STATUS_ICONS[order.status]} ${order.reference} — ${order.serviceTitle}`.slice(0, 60),
        `adm:o:${order.id}`,
      )
      .row();
  });
  return keyboard;
}

export function adminPaginationKeyboard(page: number, totalPages: number) {
  const keyboard = new InlineKeyboard();
  if (page > 0) keyboard.text("⬅️ جدیدتر", `adm:all:${page - 1}`);
  if (page < totalPages - 1) keyboard.text("قدیمی‌تر ➡️", `adm:all:${page + 1}`);
  keyboard.row().text("↩️ پنل مدیریت", "adm:home");
  return keyboard;
}

export function adminOrdersListKeyboard(
  orders: { id: string; reference: string; status: OrderStatus; serviceTitle: string }[],
  page: number,
  totalPages: number,
) {
  const keyboard = adminOrdersKeyboard(orders);
  if (page > 0) keyboard.text("⬅️ جدیدتر", `adm:all:${page - 1}`);
  if (page < totalPages - 1) keyboard.text("قدیمی‌تر ➡️", `adm:all:${page + 1}`);
  keyboard.row().text("↩️ پنل مدیریت", "adm:home");
  return keyboard;
}

export function adminOrderKeyboard(order: Order) {
  const keyboard = new InlineKeyboard()
    .text("🔄 تغییر وضعیت", `adm:st:${order.id}`)
    .text(order.paid ? "💳 پرداخت‌شده ✅" : "💳 ثبت پرداخت", `adm:pay:${order.id}`)
    .row()
    .text("📝 یادداشت داخلی", `adm:note:${order.id}`)
    .text("✉️ پیام به مشتری", `adm:reply:${order.id}`)
    .row();
  if (order.brief) keyboard.text("📎 مشاهدهٔ بریف", `adm:file:${order.id}`).row();
  keyboard.text("📥 سفارش‌های جدید", "adm:new").text("🏠 پنل", "adm:home");
  return keyboard;
}

export function statusPickerKeyboard(orderId: string, current: OrderStatus) {
  const keyboard = new InlineKeyboard();
  const statuses = (Object.keys(STATUS_LABELS) as OrderStatus[]).filter(
    (status) => status !== current,
  );
  statuses.forEach((status, index) => {
    keyboard.text(STATUS_LABELS[status], `adm:s:${orderId}:${status}`);
    if (index % 2 === 1) keyboard.row();
  });
  if (statuses.length % 2 === 1) keyboard.row();
  keyboard.text("↩️ پنل مدیریت", "adm:home");
  return keyboard;
}

export function broadcastConfirmKeyboard() {
  return new InlineKeyboard()
    .text("✅ ارسال کن", "adm:bc:confirm")
    .text("✖️ لغو", "adm:bc:cancel");
}
