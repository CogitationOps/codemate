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

const defaultThreads = [
  { id: "thread-1", title: "Build PWA shell" },
  { id: "thread-2", title: "Landing page ideas" },
  { id: "thread-3", title: "API schema cleanup" },
];

function getMessageText(parts: Array<{ type: string; text?: string }>) {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("\n");
}

export function ChatShell() {
  const [activeThreadId, setActiveThreadId] = useState(defaultThreads[0].id);

  const { messages, sendMessage, status, stop, setMessages } = useChat();

  const canSubmit = status !== "submitted" && status !== "streaming";

  const greeting = useMemo(
    () =>
      activeThreadId === "thread-1"
        ? "Help me convert this Next.js app into an installable PWA."
        : "What should we build next?",
    [activeThreadId]
  );

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar
        activeThreadId={activeThreadId}
        onNewChat={() => {
          setMessages([]);
          setActiveThreadId(`thread-${Date.now()}`);
        }}
        onSelectThread={setActiveThreadId}
        threads={defaultThreads}
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
                const content = getMessageText(message.parts);
                if (!content) return null;

                return (
                  <Message from={message.role} key={message.id}>
                    <MessageContent>
                      {message.role === "assistant" ? (
                        <MessageResponse>{content}</MessageResponse>
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
