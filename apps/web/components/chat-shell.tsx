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
import { useEffect, useMemo, useState } from "react";
import type { UIMessage } from "ai";

function getMessageText(parts: Array<{ type: string; text?: string }>) {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("\n");
}

function toAssistantActivityParts(message: UIMessage): Array<{ label: string; payload: string; type: "reasoning" | "tool" }> {
  const activities: Array<{ label: string; payload: string; type: "reasoning" | "tool" }> = [];

  for (const part of message.parts as Array<Record<string, unknown>>) {
    if (!part || typeof part !== "object" || typeof part.type !== "string") {
      continue;
    }

    if (part.type === "step-start") {
      continue;
    }

    if (part.type === "reasoning") {
      const text = typeof part.text === "string" ? part.text : "";
      if (text) {
        activities.push({ label: "Reasoning", payload: text, type: "reasoning" });
      }
      continue;
    }

    if (part.type.startsWith("tool-")) {
      const toolName = part.type.slice("tool-".length);
      const state = typeof part.state === "string" ? part.state : "unknown";
      
      let displayPayload = "";
      if (typeof part.input === "object") {
        displayPayload += `Input: ${JSON.stringify(part.input, null, 2)}\n`;
      }
      if (state === "result" && typeof part.output === "object") {
        displayPayload += `Output: ${JSON.stringify(part.output, null, 2)}`;
      } else if (state === "error") {
        displayPayload += `Error: ${part.errorText}`;
      } else {
        displayPayload += `Status: ${state}`;
      }

      activities.push({ 
        label: "Tool: " + toolName.replace(/_/g, " "), 
        payload: displayPayload,
        type: "tool"
      });
    }
  }

  return activities;
}

export function ChatShell() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem("last_active_workspace");
    if (saved) {
      // Defer to avoid "cascading renders" lint error while still hydrating smoothly
      queueMicrotask(() => {
        setActiveWorkspaceId(saved);
      });
    }
  }, []);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: activeWorkspaceId || "no-workspace",
    // @ts-expect-error - body is supported by @ai-sdk/react but showing type conflict locally
    body: {
      workspaceId: activeWorkspaceId,
    },
  });

  const canSubmit = status !== "submitted" && status !== "streaming";

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
                          {activities.length > 0 && (
                            <div className="mt-4 space-y-2 border-l-2 border-primary/20 pl-4">
                              {activities.map((activity, idx) => (
                                <details className="group rounded-lg border bg-muted/50 p-2 text-xs transition-colors hover:bg-muted" key={`${activity.label}-${idx}`}>
                                  <summary className="flex cursor-pointer items-center gap-2 font-medium">
                                    <div className={`size-1.5 rounded-full ${activity.type === "reasoning" ? "bg-blue-400" : "bg-primary animate-pulse"}`} />
                                    <span>{activity.label}</span>
                                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary-foreground/70 font-bold uppercase tracking-wider transform scale-90 group-open:rotate-180 transition-transform">
                                      {activity.type === "reasoning" ? "Thought" : "Action"}
                                    </span>
                                  </summary>
                                  <pre className="mt-3 overflow-x-auto rounded bg-background/50 p-2 font-mono text-muted-foreground leading-relaxed">
                                    {activity.payload}
                                  </pre>
                                </details>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{content}</p>
                      )}
                    </MessageContent>
                  </Message>
                );
              })}
              {status === "streaming" && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground animate-pulse">
                  <Bot className="size-3" />
                  <span>Thinking...</span>
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="border-t border-border/60 bg-background px-3 py-3 md:px-6">
            <div className="mx-auto w-full max-w-4xl">
              <PromptInput
                onSubmit={async ({ text }) => {
                  const clean = text.trim();
                  if (!clean || !canSubmit) return;
                  if (!activeWorkspaceId) {
                    // Logic to prompt user to select/create a workspace
                    return;
                  }
                  await sendMessage({ text: clean });
                }}
              >
                <PromptInputBody>
                  <PromptInputTextarea placeholder={activeWorkspaceId ? "Ask anything about your codebase..." : "Select a workspace to start chatting..."} />
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
