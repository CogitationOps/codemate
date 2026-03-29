import { NextResponse } from "next/server";
import { createWorkspace } from "@/backend/services/workspace-service";

export async function POST(req: Request) {
  try {
    const { name, repoUrl } = await req.json();
    if (!repoUrl) {
      return NextResponse.json({ error: "repoUrl is required" }, { status: 400 });
    }

    const workspace = await createWorkspace(name, repoUrl);
    return NextResponse.json(workspace);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create workspace";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
