import { Redis } from "@upstash/redis";
import type { UIMessage } from "ai";

export type ChatThread = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  lastUserMessage: string;
};

const THREAD_INDEX_KEY = "chat:threads";

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }
  return new Redis({ url, token });
}

function threadKey(id: string): string {
  return "chat:thread:" + id;
}

function messagesKey(id: string): string {
  return "chat:messages:" + id;
}

function extractText(message: UIMessage): string {
  return message.parts
    .map((part) => {
      if (part.type !== "text") {
        return "";
      }
      return part.text ?? "";
    })
    .filter((text) => text.length > 0)
    .join(" ")
    .trim();
}

function deriveTitle(messages: UIMessage[]): string {
  const userMessage = messages.find((message) => message.role === "user");
  const text = userMessage ? extractText(userMessage) : "";
  if (!text) {
    return "New Chat";
  }
  return text.length > 56 ? text.slice(0, 56) + "..." : text;
}

function parseThread(value: unknown): ChatThread | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const raw = value as Record<string, unknown>;
  if (
    typeof raw.id !== "string" ||
    typeof raw.title !== "string" ||
    typeof raw.createdAt !== "number" ||
    typeof raw.updatedAt !== "number" ||
    typeof raw.lastUserMessage !== "string"
  ) {
    return null;
  }
  return {
    id: raw.id,
    title: raw.title,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    lastUserMessage: raw.lastUserMessage,
  };
}

function parseMessages(value: unknown): UIMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as UIMessage[];
}

export function isChatStoreConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export async function listChatThreads(limit = 30): Promise<ChatThread[]> {
  const redis = getRedis();
  if (!redis) {
    return [];
  }

  const ids = await redis.zrange<string[]>(THREAD_INDEX_KEY, 0, Math.max(0, limit - 1), {
    rev: true,
  });

  const threads: ChatThread[] = [];
  for (const id of ids) {
    const raw = await redis.get<unknown>(threadKey(id));
    const thread = parseThread(raw);
    if (thread) {
      threads.push(thread);
    }
  }
  return threads;
}

export async function getChatById(id: string): Promise<{ thread: ChatThread | null; messages: UIMessage[] }> {
  const redis = getRedis();
  if (!redis) {
    return { thread: null, messages: [] };
  }

  const [threadRaw, messagesRaw] = await Promise.all([
    redis.get<unknown>(threadKey(id)),
    redis.get<unknown>(messagesKey(id)),
  ]);

  return {
    thread: parseThread(threadRaw),
    messages: parseMessages(messagesRaw),
  };
}

export async function saveChatConversation(id: string, messages: UIMessage[]): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return;
  }

  const now = Date.now();
  const existing = parseThread(await redis.get<unknown>(threadKey(id)));
  const lastUser = [...messages]
    .reverse()
    .find((message) => message.role === "user");
  const lastUserMessage = lastUser ? extractText(lastUser) : existing?.lastUserMessage ?? "";

  const thread: ChatThread = {
    id,
    title: existing?.title && existing.title !== "New Chat" ? existing.title : deriveTitle(messages),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    lastUserMessage,
  };

  await Promise.all([
    redis.set(threadKey(id), thread),
    redis.set(messagesKey(id), messages),
    redis.zadd(THREAD_INDEX_KEY, {
      score: now,
      member: id,
    }),
  ]);
}
