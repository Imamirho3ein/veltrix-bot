# استقرار روی VPS با Docker

اگر از Render/GitHub استفاده نمی‌خواهید، می‌توانید ربات را روی هر VPS ارزان
(مثلاً اروپا) با Docker اجرا کنید.

## ۱. آماده‌سازی سرور

```bash
# Ubuntu 22.04+
apt update && apt install -y docker.io docker-compose git
```

## ۲. دریافت کد

```bash
git clone https://github.com/Imamirho3ein/veltrix-bot.git
cd veltrix-bot
```

## ۳. تنظیم متغیرهای محیطی

```bash
cp .env.example .env
nano .env
```

حداقل این‌ها را تنظیم کنید:

| Key | Value |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | توکن ربات |
| `ADMIN_TELEGRAM_IDS` | `8917877282` |
| `TELEGRAM_CHANNEL_ID` | `@VeeltrixStudio` |
| `FORCE_CHANNEL_JOIN` | `true` |
| `TELEGRAM_CHANNEL_URL` | `https://t.me/VeeltrixStudio` |
| `TELEGRAM_SUPPORT_URL` | `https://t.me/ImAmirh3ein` |
| `SITE_URL` | `https://veltrixstudio.ir` |
| `BRAND_NAME` | `VELTRIX STUDIO` |

اگر سرور به تلگرام دسترسی ندارد (بلاک/فیلتر)، پروکسی بگذارید:

```
TELEGRAM_API_PROXY="socks5://user:pass@host:port"
```

## ۴. اجرا

```bash
docker compose up -d --build
docker compose logs -f
```

لاگ سلامت:

```
[bot] health server listening on :10000
[bot] @VeltrixStudio_bot is up and running.
```

داده‌ها در `data/` روی همین سرور ذخیره می‌شوند و با ری‌استارت پاک نمی‌شوند
(بدون دیسک رندر، این مزیت اصلی VPS است).

## ۵. به‌روزرسانی

```bash
git pull
docker compose up -d --build
```

## نگهداری

- **بکاپ**: از پوشهٔ `data/` دوره‌ای بگیرید (`tar czf data-backup.tar.gz data/`).
- **ری‌استارت خودکار بعد از reboot سرور**: در `docker-compose.yml` سرویس
  `restart: unless-stopped` دارد.
- ربات تبلیغات (`veltrix-ads`) هم دقیقاً با همین الگو اجرا می‌شود؛ فقط فایل
  `.env` آن با `ADS_BOT_TOKEN` تنظیم شود.
