# Ø§Ø³ØªÙ‚Ø±Ø§Ø± Û²Û´/Û· â€” Ø¨Ø¯ÙˆÙ† Ø³ÛŒØ³ØªÙ… Ø´Ø®ØµÛŒ Ùˆ Ø¨Ø¯ÙˆÙ† VPN

Ø±Ø¨Ø§Øª Ø§Ø² **long polling** Ø§Ø³ØªÙØ§Ø¯Ù‡ Ù…ÛŒâ€ŒÚ©Ù†Ø¯Ø› ÛŒØ¹Ù†ÛŒ Ø¨Ù‡ Ù¾ÙˆØ±Øª ÙˆØ±ÙˆØ¯ÛŒØŒ Ø¯Ø§Ù…Ù†Ù‡ ÛŒØ§ ÙˆØ¨Ù‡ÙˆÚ© Ù†ÛŒØ§Ø²ÛŒ
Ù†Ø¯Ø§Ø±Ø¯. Ú©Ø§ÙÛŒ Ø§Ø³Øª ÛŒÚ© Ø³Ø±ÙˆØ± **Ø®Ø§Ø±Ø¬ Ø§Ø² Ø§ÛŒØ±Ø§Ù†** Ø¯Ø§Ø´ØªÙ‡ Ø¨Ø§Ø´ÛŒØ¯ ØªØ§ Ø§ØªØµØ§Ù„ Ø¨Ù‡
`api.telegram.org` Ø¨Ø¯ÙˆÙ† VPN Ø¨Ø±Ù‚Ø±Ø§Ø± Ø´ÙˆØ¯. Ø¨Ø§ Ø§ÛŒÙ† Ú©Ø§Ø± Ø±Ø¨Ø§Øª Ø­ØªÛŒ ÙˆÙ‚ØªÛŒ Ú©Ø§Ù…Ù¾ÛŒÙˆØªØ± Ø´Ù…Ø§ Ø®Ø§Ù…ÙˆØ´
Ø§Ø³ØªØŒ Û²Û´ Ø³Ø§Ø¹ØªÙ‡ Ø±ÙˆØ´Ù† Ù…ÛŒâ€ŒÙ…Ø§Ù†Ø¯.

> âš ï¸ Ø¯Ø± Ø§ÛŒØ±Ø§Ù† Ø¨Ø¯ÙˆÙ† Ø³Ø±ÙˆØ± Ø®Ø§Ø±Ø¬ÛŒØŒ ØªÙ„Ú¯Ø±Ø§Ù… ÙÙ‚Ø· Ø¨Ø§ VPN Ø¯Ø± Ø¯Ø³ØªØ±Ø³ Ø§Ø³Øª. Ø±Ø§Ù‡â€ŒØ­Ù„ Ø¯Ø§Ø¦Ù…ÛŒØŒ Ø§Ø¬Ø±Ø§ÛŒ
> Ø±Ø¨Ø§Øª Ø±ÙˆÛŒ ÛŒÚ© VPS Ø®Ø§Ø±Ø¬ Ø§Ø² Ø§ÛŒØ±Ø§Ù† Ø§Ø³ØªØŒ Ù†Ù‡ VPN Ø±ÙˆÛŒ Ø³ÛŒØ³ØªÙ… Ø´Ù…Ø§.

---

## Ú¯Ø²ÛŒÙ†Ù‡Ù” Û± (Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ÛŒ): VPS Ø§ÙˆØ¨ÙˆÙ†ØªÙˆ

Ù‡Ø± VPS Ø§Ø±Ø²Ø§Ù† Ø¨Ø§ Û± Ú¯ÛŒÚ¯ Ø±Ù… Ú©Ø§ÙÛŒ Ø§Ø³ØªØ› Ù…Ø«Ù„Ø§Ù‹ Hetzner (Ø¢Ù„Ù…Ø§Ù†/ÙÙ†Ù„Ø§Ù†Ø¯)ØŒ ContaboØŒ
Oracle Cloud Free Tier ÛŒØ§ VPSÙ‡Ø§ÛŒ Ø§ÛŒØ±Ø§Ù†ÛŒâ€ŒØªØ¨Ø§Ø±Ù Ø®Ø§Ø±Ø¬ Ø§Ø² Ø§ÛŒØ±Ø§Ù†.

### Û±) ÙØ§ÛŒÙ„â€ŒÙ‡Ø§ Ø±Ø§ Ø±ÙˆÛŒ Ø³Ø±ÙˆØ± Ø¨Ú¯Ø°Ø§Ø±ÛŒØ¯

Ø§Ø² ÙˆÛŒÙ†Ø¯ÙˆØ² (PowerShell) Ø¯Ø± Ù¾ÙˆØ´Ù‡Ù” Ù¾Ø±ÙˆÚ˜Ù‡:

```powershell
tar --exclude node_modules --exclude .env --exclude data -czf veltrix-bot.tgz veltrix-bot
scp veltrix-bot.tgz root@SERVER_IP:/opt/
ssh root@SERVER_IP "cd /opt && tar -xzf veltrix-bot.tgz"
```

Ø§Ú¯Ø± Ù¾ÙˆØ´Ù‡Ù” `data` Ø±ÙˆÛŒ Ø³ÛŒØ³ØªÙ… Ø´Ù…Ø§ Ø³ÙØ§Ø±Ø´ ÙˆØ§Ù‚Ø¹ÛŒ Ø¯Ø§Ø±Ø¯ Ùˆ Ù…ÛŒâ€ŒØ®ÙˆØ§Ù‡ÛŒØ¯ Ù…Ù†ØªÙ‚Ù„ Ø´ÙˆØ¯ØŒ `--exclude data`
Ø±Ø§ Ø¨Ø±Ø¯Ø§Ø±ÛŒØ¯.

### Û²) ÙØ§ÛŒÙ„ `.env` Ø±Ø§ Ø±ÙˆÛŒ Ø³Ø±ÙˆØ± Ø¨Ø³Ø§Ø²ÛŒØ¯

```bash
ssh root@SERVER_IP
nano /opt/veltrix-bot/.env
```

Ù…Ø­ØªÙˆØ§ (ØªÙˆÚ©Ù† ÙˆØ§Ù‚Ø¹ÛŒ Ø±Ø§ Ø¬Ø§ÛŒÚ¯Ø²ÛŒÙ† Ú©Ù†ÛŒØ¯):

```env
TELEGRAM_BOT_TOKEN="TOKEN"
ADMIN_TELEGRAM_IDS="8917877282"
TELEGRAM_CHANNEL_ID="@VeeltrixStudio"
FORCE_CHANNEL_JOIN="true"
TELEGRAM_API_PROXY=""
BRAND_NAME="VELTRIX STUDIO"
SITE_URL="https://veltrixstudio.ir"
TELEGRAM_CHANNEL_URL="https://t.me/VeeltrixStudio"
TELEGRAM_SUPPORT_URL="https://t.me/ImAmirh3ein"
INSTAGRAM_URL="https://instagram.com/veltrixstudio"
CONTACT_EMAIL="hello@veltrixstudio.ir"
```

`TELEGRAM_API_PROXY` Ø±Ø§ Ø®Ø§Ù„ÛŒ Ø¨Ú¯Ø°Ø§Ø±ÛŒØ¯Ø› Ø±ÙˆÛŒ Ø³Ø±ÙˆØ± Ø®Ø§Ø±Ø¬ÛŒ Ù†ÛŒØ§Ø²ÛŒ Ø¨Ù‡ Ù¾Ø±ÙˆÚ©Ø³ÛŒ Ù†ÛŒØ³Øª.

### Û³) Ù†ØµØ¨ Ùˆ Ø§Ø¬Ø±Ø§ÛŒ Ø®ÙˆØ¯Ú©Ø§Ø±

```bash
bash /opt/veltrix-bot/deploy/setup-vps.sh
```

Ø§ÛŒÙ† Ø§Ø³Ú©Ø±ÛŒÙ¾Øª Node.js 22 Ø±Ø§ Ù†ØµØ¨ Ù…ÛŒâ€ŒÚ©Ù†Ø¯ØŒ Ú©Ø§Ø±Ø¨Ø± `veltrixbot` Ù…ÛŒâ€ŒØ³Ø§Ø²Ø¯ØŒ ÙˆØ§Ø¨Ø³ØªÚ¯ÛŒâ€ŒÙ‡Ø§ Ø±Ø§
Ù†ØµØ¨ Ù…ÛŒâ€ŒÚ©Ù†Ø¯ Ùˆ Ø³Ø±ÙˆÛŒØ³ systemd Ø±Ø§ ÙØ¹Ø§Ù„ Ù…ÛŒâ€ŒÚ©Ù†Ø¯ (Ø±ÛŒâ€ŒØ§Ø³ØªØ§Ø±Øª Ø®ÙˆØ¯Ú©Ø§Ø± Ø¨Ø¹Ø¯ Ø§Ø² Ú©Ø±Ø´ ÛŒØ§ Ø±ÛŒØ¨ÙˆØª).

Ø¨Ø±Ø±Ø³ÛŒ:

```bash
systemctl status veltrix-bot
journalctl -u veltrix-bot -f
```

Ø¨Ø§ÛŒØ¯ Ø¨Ø¨ÛŒÙ†ÛŒØ¯:

```
[bot] @VeltrixStudio_bot is up and running.
```

### Û´) Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø¨Ø¹Ø¯ÛŒ

```bash
scp veltrix-bot.tgz root@SERVER_IP:/opt/   # ÛŒØ§ git pull
ssh root@SERVER_IP "cd /opt && tar -xzf veltrix-bot.tgz"
ssh root@SERVER_IP "cd /opt/veltrix-bot && sudo -u veltrixbot npm ci && systemctl restart veltrix-bot"
```

### Ûµ) Ø¨Ú©Ø§Ù¾ Ø±ÙˆØ²Ø§Ù†Ù‡ (Ø§Ø®ØªÛŒØ§Ø±ÛŒ)

```bash
crontab -e
```

```cron
0 3 * * * tar -czf /root/veltrix-data-$(date +\%F).tgz -C /opt/veltrix-bot data
```

---

## Ú¯Ø²ÛŒÙ†Ù‡Ù” Û²: Docker (Ù‡Ø± Ø³Ø±ÙˆØ±ÛŒ)

Ø§Ú¯Ø± Docker Ø¯Ø§Ø±ÛŒØ¯:

```bash
cd /opt/veltrix-bot
docker compose up -d --build
docker compose logs -f
```

ÙØ§ÛŒÙ„ `.env` Ú©Ù†Ø§Ø± `docker-compose.yml` Ø®ÙˆØ§Ù†Ø¯Ù‡ Ù…ÛŒâ€ŒØ´ÙˆØ¯ Ùˆ Ù¾ÙˆØ´Ù‡Ù” `data` Ø¨Ù‡â€ŒØµÙˆØ±Øª volume
Ø¨Ø§Ù‚ÛŒ Ù…ÛŒâ€ŒÙ…Ø§Ù†Ø¯. Ø¢Ù¾Ø¯ÛŒØª:

```bash
docker compose up -d --build
```

---

## Ú¯Ø²ÛŒÙ†Ù‡Ù” Û³: Railway

1. Ø¯Ø± [railway.app](https://railway.app) Ù¾Ø±ÙˆÚ˜Ù‡Ù” Ø¬Ø¯ÛŒØ¯ Ø¨Ø³Ø§Ø²ÛŒØ¯ Ùˆ Ù‡Ù…ÛŒÙ† Ù¾ÙˆØ´Ù‡ Ø±Ø§ (Ø§Ø²
   GitHub ÛŒØ§ Ø¨Ø§ CLI) deploy Ú©Ù†ÛŒØ¯.
2. **Volume** Ø¨Ø³Ø§Ø²ÛŒØ¯ Ùˆ Ø¢Ù† Ø±Ø§ Ø¨Ù‡ Ù…Ø³ÛŒØ± `/app/data` ÙˆØµÙ„ Ú©Ù†ÛŒØ¯.
3. Ø¯Ø± Ø¨Ø®Ø´ Variables Ù‡Ù…Ø§Ù† Ù…Ù‚Ø§Ø¯ÛŒØ± `.env` Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯ (Ø¨Ù‡â€ŒØ®ØµÙˆØµ `TELEGRAM_BOT_TOKEN`).
4. Railway Ø¨Ù‡â€ŒØµÙˆØ±Øª Ù¾ÛŒØ´â€ŒÙØ±Ø¶ Dockerfile Ø±Ø§ ØªØ´Ø®ÛŒØµ Ù…ÛŒâ€ŒØ¯Ù‡Ø¯Ø› Ú†ÙˆÙ† Ø±Ø¨Ø§Øª long polling Ø§Ø³Øª
   Ø¨Ù‡ Ù¾ÙˆØ±Øª/Ø¯Ø§Ù…Ù†Ù‡ Ù†ÛŒØ§Ø²ÛŒ Ù†Ø¯Ø§Ø±Ø¯.

---

## Ú¯Ø²ÛŒÙ†Ù‡Ù” Û´: Fly.io

```bash
fly auth login
fly launch --no-deploy
fly volumes create veltrix_data --size 1
fly secrets set TELEGRAM_BOT_TOKEN="TOKEN" ADMIN_TELEGRAM_IDS="8917877282" TELEGRAM_CHANNEL_ID="@VeeltrixStudio" FORCE_CHANNEL_JOIN="true" TELEGRAM_CHANNEL_URL="https://t.me/VeeltrixStudio" TELEGRAM_SUPPORT_URL="https://t.me/ImAmirh3ein"
fly deploy
fly scale count 1
```

`fly.toml` Ø¢Ù…Ø§Ø¯Ù‡ Ø¯Ø± Ù¾Ø±ÙˆÚ˜Ù‡ Ø§Ø³Øª Ùˆ volume Ø±Ø§ Ø±ÙˆÛŒ `/app/data` mount Ù…ÛŒâ€ŒÚ©Ù†Ø¯.

> Ù¾Ù„Ù†â€ŒÙ‡Ø§ÛŒ Ø±Ø§ÛŒÚ¯Ø§Ù† Ù…Ø¹Ù…ÙˆÙ„Ø§Ù‹ Ø¨Ø¹Ø¯ Ø§Ø² Ø¨ÛŒâ€ŒÚ©Ø§Ø±ÛŒ sleep Ù…ÛŒâ€ŒØ´ÙˆÙ†Ø¯ Ùˆ Ø¨Ø±Ø§ÛŒ Ø±Ø¨Ø§Øª Û²Û´/Û· Ù…Ù†Ø§Ø³Ø¨
> Ù†ÛŒØ³ØªÙ†Ø¯. ÛŒÚ© VPS Ú©ÙˆÚ†Ú© ÛŒØ§ Ù¾Ù„Ù† Ø§Ø±Ø²Ø§Ù† Ù‡Ù…ÛŒØ´Ù‡â€ŒØ±ÙˆØ´Ù† Ø§Ù†ØªØ®Ø§Ø¨ Ù…Ø·Ù…Ø¦Ù†â€ŒØªØ±ÛŒ Ø§Ø³Øª.

---

## Ú†Ú©â€ŒÙ„ÛŒØ³Øª Ø¨Ø¹Ø¯ Ø§Ø² Ø§Ø³ØªÙ‚Ø±Ø§Ø±

- [ ] `journalctl -u veltrix-bot -f` Ù¾ÛŒØ§Ù… `is up and running` Ø±Ø§ Ù†Ø´Ø§Ù† Ù…ÛŒâ€ŒØ¯Ù‡Ø¯.
- [ ] Ø±Ø¨Ø§Øª Ø¯Ø± Ú©Ø§Ù†Ø§Ù„ `@VeeltrixStudio` **Ø§Ø¯Ù…ÛŒÙ†** Ø§Ø³Øª (Ø¨Ø±Ø§ÛŒ Ø§Ø¹Ù„Ø§Ù† Ø³ÙØ§Ø±Ø´ Ùˆ Ø¨Ø±Ø±Ø³ÛŒ Ø¹Ø¶ÙˆÛŒØª).
- [ ] Ø¯Ø± Ø±Ø¨Ø§Øª `/gate` Ø±Ø§ Ø¨Ø²Ù†ÛŒØ¯Ø› Â«ÙØ¹Ø§Ù„: Ø¨Ù„Ù‡Â» Ùˆ Ù†Ù‚Ø´ Ø±Ø¨Ø§Øª Â«Ø§Ø¯Ù…ÛŒÙ†Â» Ø±Ø§ Ø¨Ø¨ÛŒÙ†ÛŒØ¯.
- [ ] Ø¨Ø§ Ø­Ø³Ø§Ø¨ÛŒ Ú©Ù‡ Ø¹Ø¶Ùˆ Ú©Ø§Ù†Ø§Ù„ Ù†ÛŒØ³Øª `/start` Ø¨Ø²Ù†ÛŒØ¯Ø› Ø¨Ø§ÛŒØ¯ Ù¾ÛŒØ§Ù… Â«ðŸ”’ Ø¹Ø¶ÙˆÛŒØª Ø¯Ø± Ú©Ø§Ù†Ø§Ù„ Ø§Ù„Ø²Ø§Ù…ÛŒ
      Ø§Ø³ØªÂ» Ø¨ÛŒØ§ÛŒØ¯.
- [ ] Ø¨Ø§ Ø­Ø³Ø§Ø¨ÛŒ Ú©Ù‡ Ø¹Ø¶Ùˆ Ø§Ø³Øª `/start` Ø¨Ø²Ù†ÛŒØ¯Ø› Ù…Ù†ÙˆÛŒ Ø§ØµÙ„ÛŒ Ø¨ÛŒØ§ÛŒØ¯.
- [ ] ÛŒÚ© Ø³ÙØ§Ø±Ø´ ØªØ³ØªÛŒ Ø«Ø¨Øª Ú©Ù†ÛŒØ¯ Ùˆ Ø§Ø¹Ù„Ø§Ù† Ø¢Ù† Ø±Ø§ Ø¯Ø± Ú©Ø§Ù†Ø§Ù„ Ø¨Ø¨ÛŒÙ†ÛŒØ¯.
- [ ] Ù¾ÙˆØ´Ù‡Ù” `data` Ø±ÙˆÛŒ Ø³Ø±ÙˆØ± Ù†ÙˆØ´ØªÙ‡ Ù…ÛŒâ€ŒØ´ÙˆØ¯ (orders.json / sessions.json).

## Ù†Ú©Ø§Øª Ø§Ù…Ù†ÛŒØªÛŒ

- ÙØ§ÛŒÙ„ `.env` Ø±Ø§ Ø¯Ø± Ú¯ÛŒØª ÛŒØ§ Ú†Øª Ø¹Ù…ÙˆÙ…ÛŒ Ù†ÙØ±Ø³ØªÛŒØ¯.
- Ø§Ø² Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ù‚ÙˆÛŒ/Ú©Ù„ÛŒØ¯ SSH Ø§Ø³ØªÙØ§Ø¯Ù‡ Ú©Ù†ÛŒØ¯ Ùˆ ÙˆØ±ÙˆØ¯ Ø¨Ø§ Ù¾Ø³ÙˆØ±Ø¯ Ø±Ø§ Ø¯Ø± Ø³Ø±ÙˆØ± ØºÛŒØ±ÙØ¹Ø§Ù„ Ú©Ù†ÛŒØ¯.
- ØªÙˆÚ©Ù† Ø±Ø¨Ø§Øª Ø±Ø§ Ø§Ú¯Ø± Ø¬Ø§ÛŒÛŒ Ù„Ùˆ Ø±ÙØªØŒ Ø§Ø² `@BotFather` â†’ `/revoke` ØªÙˆÚ©Ù† Ø¬Ø¯ÛŒØ¯ Ø¨Ú¯ÛŒØ±ÛŒØ¯ Ùˆ
  `.env` Ø±Ø§ Ø¨Ù‡â€ŒØ±ÙˆØ² Ú©Ù†ÛŒØ¯.
