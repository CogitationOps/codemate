import { NextResponse } from "next/server";
import { listWorkspaces } from "@/backend/services/workspace-service";

export async function GET() {
  try {
    const workspaces = await listWorkspaces();
    return NextResponse.json(workspaces);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list workspaces";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
