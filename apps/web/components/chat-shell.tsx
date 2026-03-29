"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useChat } from "@ai-sdk/react";
import { Bot, RotateCcw, WandSparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { UIMessage } from "ai";

function getMessageText(parts: Array<{ type: string; text?: string }>) {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("\n");
}

function toAssistantActivityParts(message: UIMessage): Array<{ label: string; payload: string }> {
  const activities: Array<{ label: string; payload: string }> = [];

  for (const part of message.parts as Array<Record<string, unknown>>) {
    if (!part || typeof part !== "object" || typeof part.type !== "string") {
      continue;
    }

    if (part.type === "step-start") {
      activities.push({ label: "Step", payload: "Starting next reasoning/tool step" });
      continue;
    }

    if (part.type === "reasoning") {
      const text = typeof part.text === "string" ? part.text : "";
      if (text) {
        activities.push({ label: "Thinking", payload: text });
      }
      continue;
    }

    if (part.type.startsWith("tool-")) {
      const toolName = part.type.slice("tool-".length);
      const state = typeof part.state === "string" ? part.state : "unknown";
      const toolPayload = JSON.stringify(
        {
          state,
          input: part.input,
          output: part.output,
          errorText: part.errorText,
        },
        null,
        2
      );
      activities.push({ label: "Tool: " + toolName, payload: toolPayload });
    }
  }

  return activities;
}

export function ChatShell() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("last_active_workspace") || "";
    }
    return "";
  });

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: activeWorkspaceId || "no-workspace",
    // @ts-expect-error - body is supported by @ai-sdk/react but showing type conflict locally
    body: {
      workspaceId: activeWorkspaceId,
    },
  });

  const canSubmit = status !== "submitted" && status !== "streaming" && !!activeWorkspaceId;

  const handleWorkspaceSelect = (id: string) => {
    setActiveWorkspaceId(id);
    localStorage.setItem("last_active_workspace", id);
  };

  const greeting = useMemo(
    () =>
      activeWorkspaceId
        ? "Ask anything about this repository."
        : "Create or select a workspace to get started.",
    [activeWorkspaceId]
  );

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={handleWorkspaceSelect}
      />

      <SidebarInset className="bg-background">
        <div className="flex h-svh flex-col">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/90 px-3 py-2 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="text-sm text-muted-foreground">Codemate Chat</div>
            </div>
            <Button
              onClick={() => setMessages([])}
              size="sm"
              type="button"
              variant="ghost"
            >
              <RotateCcw className="size-4" />
              Clear
            </Button>
          </header>

          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="mx-auto w-full max-w-4xl px-3 py-5 md:px-6">
              {messages.length === 0 ? (
                <ConversationEmptyState
                  description={greeting}
                  icon={<Bot className="size-5" />}
                  title="Start a conversation"
                />
              ) : null}

              {messages.map((message) => {
                const content = getMessageText(message.parts as Array<{ type: string; text?: string }>);
                const activities = toAssistantActivityParts(message);

                return (
                  <Message from={message.role} key={message.id}>
                    <MessageContent>
                      {message.role === "assistant" ? (
                        <div className="space-y-2">
                          {content ? <MessageResponse>{content}</MessageResponse> : null}
                          {activities.map((activity, idx) => (
                            <details className="rounded border p-2 text-xs" key={`${activity.label}-${idx}`}>
                              <summary className="cursor-pointer font-medium">{activity.label}</summary>
                              <pre className="mt-2 whitespace-pre-wrap text-muted-foreground">{activity.payload}</pre>
                            </details>
                          ))}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{content}</p>
                      )}
                    </MessageContent>
                  </Message>
                );
              })}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="border-t border-border/60 bg-background px-3 py-3 md:px-6">
            <div className="mx-auto w-full max-w-4xl">
              <PromptInput
                onSubmit={async ({ text }) => {
                  const clean = text.trim();
                  if (!clean || !canSubmit) return;
                  await sendMessage({ text: clean });
                }}
              >
                <PromptInputBody>
                  <PromptInputTextarea placeholder="Ask anything about your codebase..." />
                </PromptInputBody>
                <PromptInputFooter>
                  <PromptInputTools>
                    <Button size="sm" type="button" variant="ghost">
                      <WandSparkles className="size-4" />
                      Reason
                    </Button>
                  </PromptInputTools>
                  <PromptInputSubmit
                    disabled={!canSubmit}
                    onStop={stop}
                    status={status}
                  />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
