export type OrderStatus =
  | "PENDING"
  | "REVIEWING"
  | "CONTACTED"
  | "IN_PROGRESS"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderBrief {
  fileId: string;
  kind: "photo" | "document";
  fileName?: string;
}

export interface Order {
  id: string;
  reference: string;
  telegramId: number;
  username?: string;
  name: string;
  phone: string;
  serviceSlug: string;
  serviceTitle: string;
  planLabel: string;
  budget: string;
  description: string;
  status: OrderStatus;
  paid?: boolean;
  notes?: string[];
  brief?: OrderBrief;
  source?: string;
  createdAt: string;
  updatedAt: string;
  history: { status: OrderStatus; at: string }[];
}

export interface TicketReply {
  at: string;
  text: string;
  from: "user" | "admin";
}

export interface Ticket {
  id: string;
  telegramId: number;
  name: string;
  message: string;
  createdAt: string;
  replies: TicketReply[];
}

export interface Settings {
  channelId?: string;
  [key: string]: string | undefined;
}

export interface Referral {
  payload: string;
  telegramId: number;
  username?: string;
  firstName?: string;
  createdAt: string;
}
