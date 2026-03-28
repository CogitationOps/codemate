export type Repo = {
  id: string;
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  updatedAt: string;
  isPrivate: boolean;
  defaultBranch: string;
};

export type CommitFile = {
  filename: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
};

export type Commit = {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  authorEmail: string;
  timestamp: string;
  files: CommitFile[];
  totalAdditions: number;
  totalDeletions: number;
};

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type Finding = {
  id: string;
  commitSha: string;
  title: string;
  severity: Severity;
  file: string;
  lines: [number, number];
  explanation: string;
  suggestion: string;
  codeExcerpt?: string;
  sourceUrls: string[];
};

export type Source = {
  title: string;
  url: string;
};

export type Attachment = {
  id: string;
  name: string;
  uri: string;
  mimeType: string;
  size?: number;
};

export type MessageRole = 'user' | 'assistant' | 'system';

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  commits?: Commit[];
  findings?: Finding[];
  sources?: Source[];
  isStreaming?: boolean;
};
