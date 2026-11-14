import "dotenv/config";

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

const proxy = clean(process.env.TELEGRAM_API_PROXY);

export const env = {
  token: clean(process.env.TELEGRAM_BOT_TOKEN),
  adminIds: clean(process.env.ADMIN_TELEGRAM_IDS)
    .split(/[,\s]+/)
    .map((item) => Number(item))
    .filter((id) => Number.isSafeInteger(id) && id > 0),
  channelId: clean(process.env.TELEGRAM_CHANNEL_ID),
  forceJoin: (clean(process.env.FORCE_CHANNEL_JOIN) || "true").toLowerCase() !== "false",
  proxy: proxy || undefined,
  brandName: clean(process.env.BRAND_NAME) || "VELTRIX STUDIO",
  siteUrl: (clean(process.env.SITE_URL) || "https://veltrixstudio.com").replace(/\/+$/, ""),
  channelUrl: clean(process.env.TELEGRAM_CHANNEL_URL) || "https://t.me/VeeltrixStudio",
  supportUrl: clean(process.env.TELEGRAM_SUPPORT_URL) || "https://t.me/ImAmirh3ein",
  instagramUrl: clean(process.env.INSTAGRAM_URL) || "https://instagram.com/veltrixstudio",
  email: clean(process.env.CONTACT_EMAIL) || "hello@veltrixstudio.com",
  phone: clean(process.env.CONTACT_PHONE),
};

export function assertConfig(): void {
  if (!env.token) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is missing. Put your BotFather token in .env and restart.",
    );
  }
}
