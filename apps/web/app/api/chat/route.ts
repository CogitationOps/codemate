import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

export const maxDuration = 30;
export const runtime = "edge";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  if (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_API_KEY) {
    return Response.json(
      {
        error:
          "Set OPENAI_API_KEY (or AI_GATEWAY_API_KEY) in apps/web/.env.local to enable chat.",
      },
      { status: 500 }
    );
  }

  const result = streamText({
    messages: await convertToModelMessages(messages),
    model: openai("gpt-4.1-mini"),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
  });
}
