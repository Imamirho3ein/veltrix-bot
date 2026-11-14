import path from "node:path";
import type { StorageAdapter } from "grammy";
import type { SessionData } from "./session.js";
import { DATA_DIR, readJson } from "./store.js";

const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

/**
 * Keeps sessions on disk so an unfinished order survives a bot restart.
 * Writes are debounced to avoid touching the disk on every update.
 */
export function fileSessionStorage(): StorageAdapter<SessionData> {
  let cache: Record<string, SessionData> | null = null;
  let timer: NodeJS.Timeout | null = null;

  const load = async (): Promise<Record<string, SessionData>> => {
    if (!cache) cache = await readJson<Record<string, SessionData>>(SESSIONS_FILE, {});
    return cache;
  };

  const flush = async (): Promise<void> => {
    if (!cache) return;
    const { promises: fs } = await import("node:fs");
    await fs.mkdir(DATA_DIR, { recursive: true });
    const temp = `${SESSIONS_FILE}.tmp`;
    await fs.writeFile(temp, JSON.stringify(cache, null, 2), "utf8");
    await fs.rename(temp, SESSIONS_FILE);
  };

  const schedule = (): void => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      void flush().catch((error) => console.warn("[bot] session flush failed", error));
    }, 800);
    timer.unref?.();
  };

  return {
    async read(key: string) {
      return (await load())[key];
    },
    async write(key: string, value: SessionData) {
      const data = await load();
      data[key] = value;
      schedule();
    },
    async delete(key: string) {
      const data = await load();
      delete data[key];
      schedule();
    },
  };
}
