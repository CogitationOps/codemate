import { NextResponse } from "next/server";

import { listChatThreads } from "@/backend/services/chat-store";

export const runtime = "edge";

export async function GET() {
  const threads = await listChatThreads(40);
  return NextResponse.json({ threads });
}
