import { NextResponse } from "next/server";

import { getChatById } from "@/backend/services/chat-store";

export const runtime = "edge";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chat = await getChatById(id);
  return NextResponse.json(chat);
}
