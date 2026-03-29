"use client";

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import type { ChatStatus } from "ai";
import { CornerDownLeftIcon, SquareIcon } from "lucide-react";
import type {
  ComponentProps,
  FormEvent,
  HTMLAttributes,
  PropsWithChildren,
} from "react";
import { createContext, useContext, useMemo, useState } from "react";

type PromptContextValue = {
  text: string;
  setText: (value: string) => void;
};

const PromptContext = createContext<PromptContextValue | null>(null);

type SubmitPayload = {
  text: string;
};

export type PromptInputProps = Omit<ComponentProps<"form">, "onSubmit"> & {
  onSubmit: (payload: SubmitPayload, event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

export function PromptInput({ className, children, onSubmit, ...props }: PromptInputProps) {
  const [text, setText] = useState("");

  const context = useMemo(() => ({ text, setText }), [text]);

  return (
    <PromptContext.Provider value={context}>
      <form
        className={cn("w-full", className)}
        onSubmit={async (event) => {
          event.preventDefault();
          const clean = text.trim();
          if (!clean) return;
          await onSubmit({ text: clean }, event);
          setText("");
        }}
        {...props}
      >
        <InputGroup className="overflow-hidden">{children}</InputGroup>
      </form>
    </PromptContext.Provider>
  );
}

export type PromptInputBodyProps = HTMLAttributes<HTMLDivElement>;

export function PromptInputBody({ className, ...props }: PromptInputBodyProps) {
  return <div className={cn("contents", className)} {...props} />;
}

export type PromptInputTextareaProps = ComponentProps<typeof InputGroupTextarea>;

export function PromptInputTextarea({
  className,
  onChange,
  onKeyDown,
  placeholder = "Ask anything...",
  ...props
}: PromptInputTextareaProps) {
  const ctx = useContext(PromptContext);
  if (!ctx) {
    throw new Error("PromptInputTextarea must be used inside PromptInput");
  }

  return (
    <InputGroupTextarea
      className={cn("field-sizing-content max-h-48 min-h-16", className)}
      name="message"
      onChange={(event) => {
        ctx.setText(event.currentTarget.value);
        onChange?.(event);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          event.currentTarget.form?.requestSubmit();
        }
        onKeyDown?.(event);
      }}
      placeholder={placeholder}
      value={ctx.text}
      {...props}
    />
  );
}

export type PromptInputFooterProps = Omit<ComponentProps<typeof InputGroupAddon>, "align">;

export function PromptInputFooter({ className, ...props }: PromptInputFooterProps) {
  return (
    <InputGroupAddon
      align="block-end"
      className={cn("justify-between gap-1", className)}
      {...props}
    />
  );
}

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>;

export function PromptInputTools({ className, ...props }: PromptInputToolsProps) {
  return <div className={cn("flex min-w-0 items-center gap-1", className)} {...props} />;
}

export type PromptInputSubmitProps = ComponentProps<typeof InputGroupButton> & {
  status?: ChatStatus;
  onStop?: () => void;
};

export function PromptInputSubmit({
  className,
  status,
  onStop,
  children,
  ...props
}: PromptInputSubmitProps) {
  const isStreaming = status === "submitted" || status === "streaming";

  return (
    <InputGroupButton
      aria-label={isStreaming ? "Stop" : "Send"}
      className={cn(className)}
      onClick={(event) => {
        if (isStreaming && onStop) {
          event.preventDefault();
          onStop();
        }
      }}
      size="icon-sm"
      type={isStreaming && onStop ? "button" : "submit"}
      variant="default"
      {...props}
    >
      {children ?? (isStreaming ? <SquareIcon className="size-4" /> : <CornerDownLeftIcon className="size-4" />)}
    </InputGroupButton>
  );
}

export function PromptInputProvider({ children }: PropsWithChildren) {
  return <>{children}</>;
}
