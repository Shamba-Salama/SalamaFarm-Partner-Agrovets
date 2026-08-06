import { api } from "@/lib/api-client";

export type ApiChatMessage = {
  id: number;
  sender: "farmer" | "store";
  text: string;
  created_at: string;
};

export type ApiLastMessage = {
  id: number;
  sender: "farmer" | "store";
  text: string;
  created_at: string;
} | null;

export type ApiThreadCustomer = {
  id: number;
  name: string;
  phone: string;
};

export type ApiThreadList = {
  id: number;
  customer: ApiThreadCustomer;
  channel: string;
  topic: string;
  unread: number;
  last_message: ApiLastMessage;
  created_at: string;
  updated_at: string;
};

export type ApiThreadDetail = ApiThreadList & {
  messages: ApiChatMessage[];
};

export type PostMessageResponse = {
  message: ApiChatMessage;
  thread: { id: number; unread: number; updated_at: string };
};

export type MarkReadResponse = {
  id: number;
  unread: number;
  updated_at: string;
};

export type MappedChatMessage = {
  id: string;
  from: "farmer" | "store";
  text: string;
  time: string;
  createdAt: string;
};

export type MappedThread = {
  id: string;
  farmer: string;
  customerId: string;
  phone: string;
  channel: string;
  topic: string;
  unread: number;
  lastMessage: MappedChatMessage | null;
  messages: MappedChatMessage[];
  messagesLoaded: boolean;
  updatedAt: string;
};

/** Display time for chat bubbles — HH:MM today, short date otherwise. */
export function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString("en-KE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return d.toLocaleDateString("en-KE", { month: "short", day: "numeric" });
}

export function apiMessageToMessage(m: ApiChatMessage): MappedChatMessage {
  return {
    id: String(m.id),
    from: m.sender === "farmer" ? "farmer" : "store",
    text: m.text ?? "",
    time: formatMessageTime(m.created_at),
    createdAt: m.created_at,
  };
}

export function apiThreadToThread(t: ApiThreadList | ApiThreadDetail): MappedThread {
  const hasMessages = "messages" in t && Array.isArray((t as ApiThreadDetail).messages);
  return {
    id: String(t.id),
    farmer: t.customer?.name ?? "",
    customerId: String(t.customer?.id ?? ""),
    phone: t.customer?.phone ?? "",
    channel: t.channel,
    topic: t.topic ?? "",
    unread: Number(t.unread ?? 0),
    lastMessage: t.last_message ? apiMessageToMessage(t.last_message) : null,
    messages: hasMessages ? (t as ApiThreadDetail).messages.map(apiMessageToMessage) : [],
    messagesLoaded: hasMessages,
    updatedAt: t.updated_at,
  };
}

function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

export async function fetchThreads(): Promise<ApiThreadList[]> {
  const data = await api.get<unknown>("/threads/");
  return unwrapList<ApiThreadList>(data);
}

export async function fetchThreadDetail(id: string): Promise<ApiThreadDetail> {
  return api.get<ApiThreadDetail>(`/threads/${id}/`);
}

export async function createThread(body: {
  customer_id: number;
  topic: string;
  channel: string;
  message?: string;
}): Promise<ApiThreadDetail> {
  const payload: Record<string, unknown> = {
    customer_id: body.customer_id,
    topic: body.topic,
    channel: body.channel,
  };
  // Omit message entirely when empty — allow_blank=False rejects "".
  if (body.message !== undefined && body.message.trim() !== "") {
    payload.message = body.message.trim();
  }
  return api.post<ApiThreadDetail>("/threads/", payload);
}

export async function postThreadMessage(id: string, text: string): Promise<PostMessageResponse> {
  return api.post<PostMessageResponse>(`/threads/${id}/messages/`, { text });
}

export async function markThreadRead(id: string): Promise<MarkReadResponse> {
  return api.post<MarkReadResponse>(`/threads/${id}/mark-read/`, {});
}
