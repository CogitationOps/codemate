import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

function hasModelKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY);
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in model output.");
  }
  return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
}

export async function generateStructuredOrFallback<T>(params: {
  system: string;
  prompt: string;
  fallback: T;
  parser: (value: unknown) => T | null;
  model?: string;
}): Promise<T> {
  if (!hasModelKey()) {
    return params.fallback;
  }

  try {
    const result = await generateText({
      model: openai(params.model ?? "gpt-4.1-mini"),
      system: params.system,
      prompt:
        params.prompt +
        "\n\nReturn ONLY a valid JSON object. No markdown, no prose, no explanation outside JSON.",
      temperature: 0.2,
    });

    const parsedJson = extractJsonObject(result.text);
    const parsed = params.parser(parsedJson);
    if (!parsed) {
      return params.fallback;
    }
    return parsed;
  } catch {
    return params.fallback;
  }
}
