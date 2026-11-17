import { randomBytes, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Order, OrderStatus, Referral, Settings, Ticket } from "./types.js";
import { env } from "./config.js";

export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const ADMINS_FILE = path.join(DATA_DIR, "admins.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const TICKETS_FILE = path.join(DATA_DIR, "tickets.json");
const REFERRALS_FILE = path.join(DATA_DIR, "referrals.json");
const EXPORT_DIR = path.join(DATA_DIR, "exports");

let lock: Promise<unknown> = Promise.resolve();

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = lock.then(task, task);
  lock = run.catch(() => undefined);
  return run;
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  await fs.writeFile(temp, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(temp, file);
}

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReference(date = new Date()): string {
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const bytes = randomBytes(4);
  let code = "";
  for (let index = 0; index < 4; index += 1) {
    code += REFERENCE_ALPHABET[bytes[index]! % REFERENCE_ALPHABET.length];
  }
  return `VT-${year}${month}-${code}`;
}

export async function listOrders(): Promise<Order[]> {
  const orders = await readJson<Order[]>(ORDERS_FILE, []);
  return orders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function listOrdersForUser(telegramId: number): Promise<Order[]> {
  const orders = await listOrders();
  return orders.filter((order) => order.telegramId === telegramId);
}

export async function findOrderById(id: string): Promise<Order | undefined> {
  return (await listOrders()).find((order) => order.id === id);
}

export async function findOrderByReference(reference: string): Promise<Order | undefined> {
  const needle = reference.trim().toUpperCase();
  return (await listOrders()).find((order) => order.reference.toUpperCase() === needle);
}

export function searchOrders(orders: Order[], query: string): Order[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return orders.filter((order) =>
    [
      order.reference,
      order.name,
      order.phone,
      order.username ?? "",
      order.serviceTitle,
      String(order.telegramId),
    ]
      .join(" ")
      .toLowerCase()
      .includes(needle),
  );
}

export async function createOrder(
  input: Omit<
    Order,
    "id" | "reference" | "status" | "createdAt" | "updatedAt" | "history" | "paid" | "notes"
  >,
): Promise<Order> {
  return serialize(async () => {
    const orders = await readJson<Order[]>(ORDERS_FILE, []);
    let reference = generateReference();
    while (orders.some((order) => order.reference === reference)) {
      reference = generateReference();
    }
    const now = new Date().toISOString();
    const order: Order = {
      ...input,
      id: randomUUID(),
      reference,
      status: "PENDING",
      paid: false,
      notes: [],
      createdAt: now,
      updatedAt: now,
      history: [{ status: "PENDING", at: now }],
    };
    orders.push(order);
    await writeJson(ORDERS_FILE, orders);
    return order;
  });
}

// ---------------------------------------------------------------------------
// Referrals: deep-link payloads such as ads_3 that came from advertising
// campaigns (see the separate veltrix-ads bot). Each (payload, user) pair is
// recorded once so the first click counts as "new lead".
// ---------------------------------------------------------------------------

export async function recordReferral(
  payload: string,
  user: { id: number; username?: string; first_name?: string },
): Promise<{ isFirst: boolean; totalForPayload: number }> {
  return serialize(async () => {
    const referrals = await readJson<Referral[]>(REFERRALS_FILE, []);
    const isFirst = !referrals.some(
      (referral) => referral.payload === payload && referral.telegramId === user.id,
    );
    if (isFirst) {
      referrals.push({
        payload,
        telegramId: user.id,
        username: user.username,
        firstName: user.first_name,
        createdAt: new Date().toISOString(),
      });
      await writeJson(REFERRALS_FILE, referrals);
    }
    const totalForPayload = referrals.filter((referral) => referral.payload === payload).length;
    return { isFirst, totalForPayload };
  });
}

export async function referralSummary(): Promise<Record<string, number>> {
  const referrals = await readJson<Referral[]>(REFERRALS_FILE, []);
  const summary: Record<string, number> = {};
  for (const referral of referrals) {
    summary[referral.payload] = (summary[referral.payload] ?? 0) + 1;
  }
  return summary;
}

export async function updateOrder(
  id: string,
  patch: Partial<Order>,
): Promise<Order | undefined> {
  return serialize(async () => {
    const orders = await readJson<Order[]>(ORDERS_FILE, []);
    const order = orders.find((item) => item.id === id);
    if (!order) return undefined;
    Object.assign(order, patch, { updatedAt: new Date().toISOString() });
    await writeJson(ORDERS_FILE, orders);
    return order;
  });
}

export async function addOrderNote(id: string, note: string): Promise<Order | undefined> {
  return serialize(async () => {
    const orders = await readJson<Order[]>(ORDERS_FILE, []);
    const order = orders.find((item) => item.id === id);
    if (!order) return undefined;
    order.notes = [...(order.notes ?? []), note];
    order.updatedAt = new Date().toISOString();
    await writeJson(ORDERS_FILE, orders);
    return order;
  });
}

export async function toggleOrderPaid(id: string): Promise<Order | undefined> {
  const order = await findOrderById(id);
  if (!order) return undefined;
  return updateOrder(id, { paid: !order.paid });
}

export async function setOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order | undefined> {
  return serialize(async () => {
    const orders = await readJson<Order[]>(ORDERS_FILE, []);
    const order = orders.find((item) => item.id === id);
    if (!order) return undefined;
    const now = new Date().toISOString();
    order.status = status;
    order.updatedAt = now;
    order.history.push({ status, at: now });
    await writeJson(ORDERS_FILE, orders);
    return order;
  });
}

export interface OrderStats {
  total: number;
  thisWeek: number;
  today: number;
  customers: number;
  paid: number;
  revenue: number;
  byStatus: Record<OrderStatus, number>;
  byService: { title: string; count: number }[];
}

export async function orderStats(): Promise<OrderStats> {
  const orders = await listOrders();
  const byStatus: Record<OrderStatus, number> = {
    PENDING: 0,
    REVIEWING: 0,
    CONTACTED: 0,
    IN_PROGRESS: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  let thisWeek = 0;
  let today = 0;
  let paid = 0;
  let revenue = 0;
  const customers = new Set<number>();
  const services = new Map<string, number>();

  for (const order of orders) {
    byStatus[order.status] = (byStatus[order.status] ?? 0) + 1;
    const created = new Date(order.createdAt).getTime();
    if (now - created <= week) thisWeek += 1;
    if (new Date(order.createdAt).toDateString() === new Date().toDateString()) {
      today += 1;
    }
    customers.add(order.telegramId);
    services.set(order.serviceTitle, (services.get(order.serviceTitle) ?? 0) + 1);
    if (order.paid) {
      paid += 1;
      const raw = order.planLabel.match(/[\d۰-۹]+/)?.[0] ?? "0";
      const latin = raw.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
      revenue += Number(latin) || 0;
    }
  }

  const byService = [...services.entries()]
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    total: orders.length,
    thisWeek,
    today,
    customers: customers.size,
    paid,
    revenue,
    byStatus,
    byService,
  };
}

export async function allCustomerIds(): Promise<number[]> {
  const orders = await listOrders();
  return [...new Set(orders.map((order) => order.telegramId))];
}

function csvCell(value: unknown): string {
  const text = String(value ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ");
  return `"${text}"`;
}

export async function exportOrdersCsv(): Promise<{ file: string; count: number }> {
  const orders = await listOrders();
  const header = [
    "reference",
    "status",
    "paid",
    "name",
    "phone",
    "telegram_id",
    "username",
    "service",
    "plan",
    "budget",
    "description",
    "notes",
    "created_at",
    "updated_at",
  ];
  const rows = orders.map((order) =>
    [
      order.reference,
      order.status,
      order.paid ? "yes" : "no",
      order.name,
      order.phone,
      order.telegramId,
      order.username ?? "",
      order.serviceTitle,
      order.planLabel,
      order.budget,
      order.description,
      (order.notes ?? []).join(" | "),
      order.createdAt,
      order.updatedAt,
    ]
      .map(csvCell)
      .join(","),
  );
  const csv = `\uFEFF${header.join(",")}\n${rows.join("\n")}\n`;
  await fs.mkdir(EXPORT_DIR, { recursive: true });
  const file = path.join(EXPORT_DIR, `orders-${new Date().toISOString().slice(0, 10)}.csv`);
  await fs.writeFile(file, csv, "utf8");
  return { file, count: orders.length };
}

// ---------------------------------------------------------------------------
// Tickets (two-way support)
// ---------------------------------------------------------------------------

export async function addTicket(input: {
  telegramId: number;
  name: string;
  message: string;
}): Promise<Ticket> {
  return serialize(async () => {
    const tickets = await readJson<Ticket[]>(TICKETS_FILE, []);
    const ticket: Ticket = {
      id: randomUUID(),
      telegramId: input.telegramId,
      name: input.name,
      message: input.message,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    tickets.push(ticket);
    await writeJson(TICKETS_FILE, tickets);
    return ticket;
  });
}

export async function addTicketReply(
  telegramId: number,
  text: string,
  from: "user" | "admin",
): Promise<void> {
  await serialize(async () => {
    const tickets = await readJson<Ticket[]>(TICKETS_FILE, []);
    const ticket = [...tickets].reverse().find((item) => item.telegramId === telegramId);
    if (!ticket) return;
    ticket.replies.push({ at: new Date().toISOString(), text, from });
    await writeJson(TICKETS_FILE, tickets);
  });
}

// ---------------------------------------------------------------------------
// Admins
// ---------------------------------------------------------------------------

export async function getAdmins(): Promise<number[]> {
  const stored = await readJson<number[]>(ADMINS_FILE, []);
  return [...new Set([...env.adminIds, ...stored])];
}

export async function isAdmin(telegramId: number | undefined): Promise<boolean> {
  if (!telegramId) return false;
  return (await getAdmins()).includes(telegramId);
}

export async function addAdmin(telegramId: number): Promise<void> {
  await serialize(async () => {
    const stored = await readJson<number[]>(ADMINS_FILE, []);
    if (!stored.includes(telegramId)) {
      stored.push(telegramId);
      await writeJson(ADMINS_FILE, stored);
    }
  });
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function getSettings(): Promise<Settings> {
  return readJson<Settings>(SETTINGS_FILE, {});
}

export async function setSetting(key: string, value: string): Promise<void> {
  await serialize(async () => {
    const settings = await readJson<Settings>(SETTINGS_FILE, {});
    settings[key] = value;
    await writeJson(SETTINGS_FILE, settings);
  });
}

export async function getChannelId(): Promise<string> {
  const settings = await getSettings();
  return (settings.channelId ?? env.channelId).trim();
}
