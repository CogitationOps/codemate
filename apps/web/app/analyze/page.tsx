"use client";

import { FormEvent, useMemo, useState } from "react";

type AnalyzeResponse = {
  repo: string;
  version: string;
  formatted: {
    summary: string[];
    issues: Array<{ severity: string; title: string; description: string }>;
    todos: Array<{ priority: number; text: string }>;
    contextFiles: Array<{ path: string; reason: string }>;
  };
};

export default function AnalyzePage() {
  const [repo, setRepo] = useState("vercel/next.js");
  const [query, setQuery] = useState("Find likely bug-prone error handling and generate TODOs");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);

  const canSubmit = useMemo(() => repo.trim().length > 0 && query.trim().length > 2, [repo, query]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo, query }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Analyze request failed");
      }
      setData(json as AnalyzeResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">Repo Analyze</h1>
      <p className="mt-2 text-sm text-neutral-600">Grep-first multi-agent pipeline with versioned context.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3 rounded-lg border p-4">
        <label className="block text-sm font-medium">
          Repository (owner/repo or GitHub URL)
          <input
            className="mt-1 w-full rounded border p-2"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="owner/repo"
          />
        </label>
        <label className="block text-sm font-medium">
          Query
          <textarea
            className="mt-1 min-h-24 w-full rounded border p-2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe bug / question"
          />
        </label>
        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="rounded bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Run Analysis"}
        </button>
      </form>

      {error ? <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {data ? (
        <section className="mt-6 space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="font-medium">Summary</h2>
            <p className="mt-1 text-xs text-neutral-500">
              {data.repo} @ {data.version.slice(0, 12)}
            </p>
            <ul className="mt-2 list-disc pl-6 text-sm">
              {data.formatted.summary.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border p-4">
            <h2 className="font-medium">Issues</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {data.formatted.issues.map((issue) => (
                <li key={issue.title + issue.severity} className="rounded border p-2">
                  <p className="font-medium">
                    [{issue.severity}] {issue.title}
                  </p>
                  <p className="text-neutral-700">{issue.description}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border p-4">
            <h2 className="font-medium">TODOs</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {data.formatted.todos.map((todo) => (
                <li key={todo.text} className="rounded border p-2">
                  <p>
                    P{todo.priority}: {todo.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border p-4">
            <h2 className="font-medium">Context Files</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {data.formatted.contextFiles.map((file) => (
                <li key={file.path}>
                  <code>{file.path}</code> - {file.reason}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  );
}
