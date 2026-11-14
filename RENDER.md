# استقرار روی Render (۲۴/۷)

Render یک سرویس ابری خارج از ایران است؛ بنابراین ربات بدون VPN و بدون روشن‌بودن
سیستم شما کار می‌کند. ربات از **long polling** استفاده می‌کند و به دامنه/وبهوک
نیازی ندارد؛ فقط برای اینکه Render بتواند سلامت سرویس را چک کند، یک مسیر
`/health` سبک اضافه شده است.

> ⚠️ **مهم دربارهٔ پلن:**
>
> - پلن **Free** رندر بعد از ۱۵ دقیقه بی‌کاری sleep می‌شود و **disk ندارد**؛
>   یعنی سفارش‌ها و نشست‌ها با هر ری‌استارت/دیپلوی پاک می‌شوند. برای ربات
>   سفارش‌گیر مناسب نیست.
> - برای اجرای واقعی ۲۴/۷ به پلن **Starter** (حدود ۷ دلار در ماه) و یک
>   **Disk 1GB** (حدود ۰٫۲۵ دلار در ماه) نیاز دارید. فایل `render.yaml` همین
>   ترکیب را آماده کرده است.

## پیش‌نیاز: مخزن گیت

Render از مخزن GitHub/GitLab/Bitbucket دیپلوی می‌کند. پروژه را به یک مخزن
(خصوصی هم اشکالی ندارد) push کنید:

```bash
cd "C:\Users\Amirhossein\Documents\Default Project\veltrix-bot"
git init
git add .
git commit -m "VELTRIX STUDIO telegram bot"
git branch -M main
git remote add origin https://github.com/USERNAME/veltrix-bot.git
git push -u origin main
```

فایل `.env` و پوشهٔ `data/` طبق `.gitignore` push نمی‌شوند؛ توکن را در Render
وارد می‌کنیم.

## روش الف: Blueprint (سریع‌ترین)

1. وارد [dashboard.render.com](https://dashboard.render.com) شوید.
2. **New +** → **Blueprint**.
3. مخزن `veltrix-bot` را انتخاب کنید. Render فایل `render.yaml` را می‌خواند.
4. در مرحلهٔ بعد مقدار `TELEGRAM_BOT_TOKEN` را وارد کنید (بقیه از قبل پر شده‌اند).
5. **Apply** را بزنید. اولین دیپلوی چند دقیقه طول می‌کشد.
6. بعد از سبز شدن سرویس، در تب **Logs** باید ببینید:
   ```
   [bot] health server listening on :10000
   [bot] @VeltrixStudio_bot is up and running.
   ```
7. آدرس `https://veltrix-bot.onrender.com/health` باید `{"ok":true,...}` برگرداند.

## روش ب: Web Service دستی

1. **New +** → **Web Service** → مخزن را وصل کنید.
2. Runtime: **Docker** (فایل `Dockerfile` در ریشه است).
3. Region: **Frankfurt**.
4. Instance Type: **Starter**.
5. Health Check Path: `/health`.
6. در **Environment** این‌ها را اضافه کنید:

   | Key | Value |
   | --- | --- |
   | `TELEGRAM_BOT_TOKEN` | توکن ربات (Secret) |
   | `ADMIN_TELEGRAM_IDS` | `8917877282` |
   | `TELEGRAM_CHANNEL_ID` | `@VeeltrixStudio` |
   | `FORCE_CHANNEL_JOIN` | `true` |
   | `TELEGRAM_CHANNEL_URL` | `https://t.me/VeeltrixStudio` |
   | `TELEGRAM_SUPPORT_URL` | `https://t.me/ImAmirh3ein` |
   | `SITE_URL` | `https://veltrixstudio.com` |
   | `BRAND_NAME` | `VELTRIX STUDIO` |

7. در تب **Disks** یک disk با نام `veltrix-data`، مسیر `/app/data` و حجم `1GB`
   بسازید.
8. **Create Web Service**.

## بعد از استقرار

- در ربات `/gate` را بزنید: باید «فعال: بله» و نقش ربات در کانال «ادمین» را
  ببینید.
- با حسابی که عضو کانال نیست `/start` بزنید → پیام «🔒 عضویت در کانال الزامی است».
- با حساب عضو `/start` بزنید → منوی اصلی.
- یک سفارش تستی ثبت کنید و اعلانش را در کانال `@VeeltrixStudio` ببینید.
- مطمئن شوید ربات در کانال **ادمین** است (برای بررسی عضویت و اعلان سفارش).

## به‌روزرسانی

با هر push به شاخهٔ `main`، Render طبق `autoDeploy: true` خودکار دیپلوی می‌کند.
داده‌های `data/` روی disk می‌مانند.

## اگر پلن Free می‌خواهید

فقط برای تست:

- در `render.yaml` مقدار `plan: starter` را به `plan: free` تغییر دهید و بلوک
  `disk` را حذف کنید (یا در داشبورد پلن را Free کنید).
- بدانید که سرویس sleep می‌شود و سفارش‌ها/نشست‌ها با هر ری‌استارت از بین
  می‌روند. برای تست کوتاه اوکی است، برای کسب‌وکار نه.

## اگر Git/GitHub نمی‌خواهید

گزینهٔ جایگزین: یک VPS ارزان با Docker. راهنمای کامل در [`DEPLOY.md`](./DEPLOY.md).
