# استقرار ۲۴/۷ — بدون سیستم شخصی و بدون VPN

ربات از **long polling** استفاده می‌کند؛ یعنی به پورت ورودی، دامنه یا وبهوک نیازی
ندارد. کافی است یک سرور **خارج از ایران** داشته باشید تا اتصال به
`api.telegram.org` بدون VPN برقرار شود. با این کار ربات حتی وقتی کامپیوتر شما خاموش
است، ۲۴ ساعته روشن می‌ماند.

> ⚠️ در ایران بدون سرور خارجی، تلگرام فقط با VPN در دسترس است. راه‌حل دائمی، اجرای
> ربات روی یک VPS خارج از ایران است، نه VPN روی سیستم شما.

---

## گزینهٔ ۱ (پیشنهادی): VPS اوبونتو

هر VPS ارزان با ۱ گیگ رم کافی است؛ مثلاً Hetzner (آلمان/فنلاند)، Contabo،
Oracle Cloud Free Tier یا VPSهای ایرانی‌تبارِ خارج از ایران.

### ۱) فایل‌ها را روی سرور بگذارید

از ویندوز (PowerShell) در پوشهٔ پروژه:

```powershell
tar --exclude node_modules --exclude .env --exclude data -czf veltrix-bot.tgz veltrix-bot
scp veltrix-bot.tgz root@SERVER_IP:/opt/
ssh root@SERVER_IP "cd /opt && tar -xzf veltrix-bot.tgz"
```

اگر پوشهٔ `data` روی سیستم شما سفارش واقعی دارد و می‌خواهید منتقل شود، `--exclude data`
را بردارید.

### ۲) فایل `.env` را روی سرور بسازید

```bash
ssh root@SERVER_IP
nano /opt/veltrix-bot/.env
```

محتوا (توکن واقعی را جایگزین کنید):

```env
TELEGRAM_BOT_TOKEN="TOKEN"
ADMIN_TELEGRAM_IDS="8917877282"
TELEGRAM_CHANNEL_ID="@VeeltrixStudio"
FORCE_CHANNEL_JOIN="true"
TELEGRAM_API_PROXY=""
BRAND_NAME="VELTRIX STUDIO"
SITE_URL="https://veltrixstudio.com"
TELEGRAM_CHANNEL_URL="https://t.me/VeeltrixStudio"
TELEGRAM_SUPPORT_URL="https://t.me/ImAmirh3ein"
INSTAGRAM_URL="https://instagram.com/veltrixstudio"
CONTACT_EMAIL="hello@veltrixstudio.com"
```

`TELEGRAM_API_PROXY` را خالی بگذارید؛ روی سرور خارجی نیازی به پروکسی نیست.

### ۳) نصب و اجرای خودکار

```bash
bash /opt/veltrix-bot/deploy/setup-vps.sh
```

این اسکریپت Node.js 22 را نصب می‌کند، کاربر `veltrixbot` می‌سازد، وابستگی‌ها را
نصب می‌کند و سرویس systemd را فعال می‌کند (ری‌استارت خودکار بعد از کرش یا ریبوت).

بررسی:

```bash
systemctl status veltrix-bot
journalctl -u veltrix-bot -f
```

باید ببینید:

```
[bot] @VeltrixStudio_bot is up and running.
```

### ۴) به‌روزرسانی بعدی

```bash
scp veltrix-bot.tgz root@SERVER_IP:/opt/   # یا git pull
ssh root@SERVER_IP "cd /opt && tar -xzf veltrix-bot.tgz"
ssh root@SERVER_IP "cd /opt/veltrix-bot && sudo -u veltrixbot npm ci && systemctl restart veltrix-bot"
```

### ۵) بکاپ روزانه (اختیاری)

```bash
crontab -e
```

```cron
0 3 * * * tar -czf /root/veltrix-data-$(date +\%F).tgz -C /opt/veltrix-bot data
```

---

## گزینهٔ ۲: Docker (هر سروری)

اگر Docker دارید:

```bash
cd /opt/veltrix-bot
docker compose up -d --build
docker compose logs -f
```

فایل `.env` کنار `docker-compose.yml` خوانده می‌شود و پوشهٔ `data` به‌صورت volume
باقی می‌ماند. آپدیت:

```bash
docker compose up -d --build
```

---

## گزینهٔ ۳: Railway

1. در [railway.app](https://railway.app) پروژهٔ جدید بسازید و همین پوشه را (از
   GitHub یا با CLI) deploy کنید.
2. **Volume** بسازید و آن را به مسیر `/app/data` وصل کنید.
3. در بخش Variables همان مقادیر `.env` را وارد کنید (به‌خصوص `TELEGRAM_BOT_TOKEN`).
4. Railway به‌صورت پیش‌فرض Dockerfile را تشخیص می‌دهد؛ چون ربات long polling است
   به پورت/دامنه نیازی ندارد.

---

## گزینهٔ ۴: Fly.io

```bash
fly auth login
fly launch --no-deploy
fly volumes create veltrix_data --size 1
fly secrets set TELEGRAM_BOT_TOKEN="TOKEN" ADMIN_TELEGRAM_IDS="8917877282" TELEGRAM_CHANNEL_ID="@VeeltrixStudio" FORCE_CHANNEL_JOIN="true" TELEGRAM_CHANNEL_URL="https://t.me/VeeltrixStudio" TELEGRAM_SUPPORT_URL="https://t.me/ImAmirh3ein"
fly deploy
fly scale count 1
```

`fly.toml` آماده در پروژه است و volume را روی `/app/data` mount می‌کند.

> پلن‌های رایگان معمولاً بعد از بی‌کاری sleep می‌شوند و برای ربات ۲۴/۷ مناسب
> نیستند. یک VPS کوچک یا پلن ارزان همیشه‌روشن انتخاب مطمئن‌تری است.

---

## چک‌لیست بعد از استقرار

- [ ] `journalctl -u veltrix-bot -f` پیام `is up and running` را نشان می‌دهد.
- [ ] ربات در کانال `@VeeltrixStudio` **ادمین** است (برای اعلان سفارش و بررسی عضویت).
- [ ] در ربات `/gate` را بزنید؛ «فعال: بله» و نقش ربات «ادمین» را ببینید.
- [ ] با حسابی که عضو کانال نیست `/start` بزنید؛ باید پیام «🔒 عضویت در کانال الزامی
      است» بیاید.
- [ ] با حسابی که عضو است `/start` بزنید؛ منوی اصلی بیاید.
- [ ] یک سفارش تستی ثبت کنید و اعلان آن را در کانال ببینید.
- [ ] پوشهٔ `data` روی سرور نوشته می‌شود (orders.json / sessions.json).

## نکات امنیتی

- فایل `.env` را در گیت یا چت عمومی نفرستید.
- از رمز عبور قوی/کلید SSH استفاده کنید و ورود با پسورد را در سرور غیرفعال کنید.
- توکن ربات را اگر جایی لو رفت، از `@BotFather` → `/revoke` توکن جدید بگیرید و
  `.env` را به‌روز کنید.
