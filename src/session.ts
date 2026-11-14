import type { Context, SessionFlavor } from "grammy";
import type { OrderBrief } from "./types.js";

export type OrderStep = "name" | "phone" | "description" | "brief" | "budget" | null;

export type PlanKey = "template" | "custom" | "consult";

export interface OrderDraft {
  step: OrderStep;
  serviceSlug?: string;
  serviceTitle?: string;
  plan?: PlanKey;
  planLabel?: string;
  name?: string;
  phone?: string;
  description?: string;
  brief?: OrderBrief;
  budget?: string;
}

export type AdminAction =
  | "search"
  | "broadcast"
  | "broadcast_all"
  | "setchannel"
  | "note"
  | null;

export type CalcStep = "type" | "design" | "pages" | "options" | null;

export interface CalculatorState {
  step: CalcStep;
  typeSlug?: string;
  design?: "template" | "custom";
  pages?: string;
  options: string[];
}

export interface SessionData {
  draft: OrderDraft | null;
  adminAction: AdminAction;
  noteOrderId: string | null;
  broadcastText: string | null;
  replyTo: number | null;
  calc: CalculatorState | null;
  support: { awaiting: boolean } | null;
}

export type BotContext = Context & SessionFlavor<SessionData>;

export function initialSession(): SessionData {
  return {
    draft: null,
    adminAction: null,
    noteOrderId: null,
    broadcastText: null,
    replyTo: null,
    calc: null,
    support: null,
  };
}

export function newDraft(base: Partial<OrderDraft> = {}): OrderDraft {
  return { step: null, ...base };
}
