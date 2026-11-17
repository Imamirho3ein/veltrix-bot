import { readFileSync } from "node:fs";

const env = readFileSync(".env", "utf8");
const line = env.split(/\r?\n/).find((l) => l.startsWith("TELEGRAM_BOT_TOKEN="));
if (!line) throw new Error("TELEGRAM_BOT_TOKEN not found in .env");
const token = line.split("=").slice(1).join("=").trim().replace(/^"|"$/g, "");

const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
const data = await res.json();
if (!data.ok) throw new Error(JSON.stringify(data));
console.log(`BOT: @${data.result.username} — "${data.result.first_name}" — reachable ✓`);
