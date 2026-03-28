import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Message, Attachment, Commit, Finding, Source } from '../types';
import { useRepo } from './repo-context';
import { fetchCommits, fetchFindings } from './api';

type ChatContextType = {
  messages: Message[];
  isStreaming: boolean;
  sendMessage: (text: string, attachments?: Attachment[]) => void;
  clearChat: () => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

const uid = () => Math.random().toString(36).slice(2);

function parseCount(text: string): number {
  const m = text.match(/\b(\d+)\b/);
  return m ? Math.min(parseInt(m[1], 10), 10) : 5;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const { token, selectedRepo } = useRepo();
  const abortRef = useRef(false);

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg: Message = { ...msg, id: uid(), timestamp: new Date() };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg.id;
  }, []);

  const updateMessage = useCallback(
    (id: string, patch: Partial<Omit<Message, 'id'>>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      );
    },
    [],
  );

  const scanCommits = useCallback(
    async (count: number) => {
      if (!selectedRepo) return;
      abortRef.current = false;
      setIsStreaming(true);

      // 1 – streaming placeholder
      const assistantId = addMessage({
        role: 'assistant',
        content: `Fetching **${count}** recent commits from \`${selectedRepo.fullName}\`…`,
        isStreaming: true,
      });

      await new Promise((r) => setTimeout(r, 800));
      if (abortRef.current) return;

      const commits = await fetchCommits(token, selectedRepo.fullName, count);

      updateMessage(assistantId, {
        content: `Scanning **${commits.length}** commits from \`${selectedRepo.fullName}\`. Analyzing each for potential bugs…`,
        commits,
      });

      const allFindings: Finding[] = [];
      const sources: Source[] = [];

      for (const commit of commits) {
        if (abortRef.current) break;
        await new Promise((r) => setTimeout(r, 700));
        const findings = await fetchFindings(token, commit.shortSha);
        allFindings.push(...findings);
        findings.forEach((f) =>
          f.sourceUrls.forEach((url) =>
            sources.push({ title: `${commit.shortSha} — ${f.file}`, url }),
          ),
        );
      }

      // 2 – final message
      const summary =
        allFindings.length === 0
          ? '✅ No issues detected in the scanned commits.'
          : `Found **${allFindings.length} potential issue${allFindings.length > 1 ? 's' : ''}** across ${commits.length} commits. Review the details below.`;

      updateMessage(assistantId, {
        content: summary,
        commits,
        findings: allFindings,
        sources: sources.length > 0 ? sources : undefined,
        isStreaming: false,
      });

      setIsStreaming(false);
    },
    [token, selectedRepo, addMessage, updateMessage],
  );

  const sendMessage = useCallback(
    (text: string, attachments?: Attachment[]) => {
      if (isStreaming) return;
      const trimmed = text.trim();

      addMessage({ role: 'user', content: trimmed || '📎 Attachment', attachments });

      const lower = trimmed.toLowerCase();
      if (lower.includes('scan') && lower.includes('commit')) {
        scanCommits(parseCount(trimmed));
      } else if (lower.includes('finding') || lower.includes('open issue')) {
        addMessage({
          role: 'assistant',
          content:
            "Run a commit scan first — tap **\"Scan last 5 commits\"** below to get started, or type _\"scan last N commits\"_.",
        });
      } else if (lower.includes('help') || lower === '') {
        addMessage({
          role: 'assistant',
          content:
            "I can scan recent commits for potential bugs and security issues.\n\n**Try:** _\"Scan last 5 commits\"_ or select a repo from the sidebar.",
        });
      } else {
        addMessage({
          role: 'assistant',
          content:
            "I'm focused on commit analysis for now. Try _\"Scan last 5 commits\"_ to find potential bugs in your recent changes.",
        });
      }
    },
    [isStreaming, addMessage, scanCommits],
  );

  const clearChat = useCallback(() => {
    abortRef.current = true;
    setMessages([]);
    setIsStreaming(false);
  }, []);

  return (
    <ChatContext.Provider value={{ messages, isStreaming, sendMessage, clearChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
