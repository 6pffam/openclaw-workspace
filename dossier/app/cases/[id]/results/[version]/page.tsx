"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Source {
  url: string;
  title: string;
}

interface Frontmatter {
  caseId?: string;
  caseName?: string;
  versionNumber?: number;
  generatedAt?: string;
  status?: string;
  sources?: Source[];
}

interface Sections {
  key_findings: string;
  entities: string;
  timeline: string;
  sources: string;
}

interface ResultsData {
  found: true;
  frontmatter: Frontmatter;
  sections: Sections;
  raw: string;
}

// ─── Section block ────────────────────────────────────────────────────────────

function SectionBlock({ label, content }: { label: string; content: string }) {
  if (!content?.trim()) return null;
  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-0.5 h-4 shrink-0" style={{ backgroundColor: "#60a5fa" }} />
        <span
          className="text-[10px] font-medium uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          {label}
        </span>
      </div>
      <div className="text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
        <ReactMarkdown
          components={{
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa" }}>
                {children}
              </a>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-white">{children}</strong>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-outside ml-5 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-outside ml-5 space-y-1">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-[15px] leading-relaxed">{children}</li>
            ),
            p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold text-white mt-5 mb-2">{children}</h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-sm font-medium mt-4 mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                {children}
              </h4>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table className="w-full text-sm border-collapse">{children}</table>
              </div>
            ),
            thead: ({ children }) => (
              <thead style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{children}</thead>
            ),
            th: ({ children }) => (
              <th
                className="text-left py-2 pr-4 text-[11px] font-medium uppercase tracking-wide"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td
                className="py-2 pr-4"
                style={{
                  color: "rgba(255,255,255,0.7)",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                {children}
              </td>
            ),
            hr: () => (
              <hr style={{ borderColor: "rgba(255,255,255,0.06)", borderTopWidth: 1, margin: "1rem 0" }} />
            ),
            blockquote: ({ children }) => (
              <blockquote
                className="pl-4 italic my-3"
                style={{
                  borderLeft: "2px solid #60a5fa",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                {children}
              </blockquote>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

// ─── Source cards ─────────────────────────────────────────────────────────────

function SourceCards({ sources }: { sources: Source[] }) {
  if (!sources?.length) return null;
  return (
    <div className="mt-4 space-y-2">
      {sources.map((s, i) => (
        <a
          key={i}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-xl transition-all"
          style={{
            border: "1px solid rgba(255,255,255,0.06)",
            backgroundColor: "rgba(255,255,255,0.02)",
          }}
        >
          <span className="text-sm font-medium truncate" style={{ color: "#60a5fa" }}>
            {s.title}
          </span>
          <span className="text-xs ml-auto shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
            ↗
          </span>
        </a>
      ))}
    </div>
  );
}

// ─── Not ready state ──────────────────────────────────────────────────────────

function NotReady() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse mb-5" />
      <p className="font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>SCOUT is working…</p>
      <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
        Results will appear here when ready.
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const { id, version } = useParams<{ id: string; version: string }>();

  const [data, setData] = useState<ResultsData | null>(null);
  const [caseName, setCaseName] = useState<string>("");
  const [notFound, setNotFound] = useState(false);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    fetch(`/api/cases/${id}`)
      .then((r) => r.json())
      .then((d) => setCaseName(d.case?.name ?? ""))
      .catch(() => {});
  }, [id]);

  const fetchResults = useCallback(async () => {
    const res = await fetch(`/api/cases/${id}/results/${version}`);
    if (!res.ok) return false;
    const d = await res.json();
    if (d.found) { setData(d as ResultsData); return true; }
    return false;
  }, [id, version]);

  useEffect(() => {
    fetchResults().then((found) => {
      if (!found) { setNotFound(true); setPolling(true); }
    });
  }, [fetchResults]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(async () => {
      const found = await fetchResults();
      if (found) { setPolling(false); setNotFound(false); clearInterval(interval); }
    }, 5000);
    return () => clearInterval(interval);
  }, [polling, fetchResults]);

  const fm = data?.frontmatter ?? {};
  const sections = data?.sections;

  const generatedAt = fm.generatedAt
    ? new Date(fm.generatedAt).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  const displayName = caseName || fm.caseName || "Case";

  return (
    <div className="min-h-screen pb-28 md:pb-0" style={{ backgroundColor: "#0d1b2a" }}>
      {/* Nav */}
      <header
        className="sticky top-0 z-10 no-print"
        style={{ backgroundColor: "#0d1b2a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 h-14 flex items-center gap-2 overflow-hidden">
          <Link href="/" className="font-semibold tracking-tight text-white text-lg">
            Dossier
          </Link>
          <span className="text-lg font-light" style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
          <Link href="/" className="text-sm transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
            Cases
          </Link>
          <span className="text-lg font-light" style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
          <Link
            href={`/cases/${id}`}
            className="text-sm transition-colors truncate max-w-[200px]"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            {displayName}
          </Link>
          <span className="text-lg font-light" style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
          <span className="text-sm font-medium text-white">Results v{version}</span>

          <div className="ml-auto flex items-center gap-2 md:gap-3 shrink-0">
            <Link
              href={`/cases/${id}`}
              className="text-sm transition-colors"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              ← Back to Case
            </Link>
            {data && (
              <button
                onClick={() => window.print()}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition-all"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Print
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-[760px] mx-auto px-4 md:px-6 py-6 md:py-10 print-content">
        {notFound && !data ? (
          <NotReady />
        ) : !data ? (
          <NotReady />
        ) : (
          <>
            {/* Report header */}
            <div className="mb-8">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-semibold text-white">{displayName}</h1>
                {generatedAt && (
                  <span className="text-xs shrink-0 pt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {generatedAt}
                  </span>
                )}
              </div>
              <p
                className="text-sm uppercase tracking-widest mt-1"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                Background Intelligence Report
              </p>
              <div className="mt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />
            </div>

            {sections?.key_findings && (
              <SectionBlock label="Key Findings" content={sections.key_findings} />
            )}

            {sections?.entities && (
              <>
                <div className="mt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }} />
                <SectionBlock label="Entities" content={sections.entities} />
              </>
            )}

            {sections?.timeline && (
              <>
                <div className="mt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }} />
                <SectionBlock label="Timeline" content={sections.timeline} />
              </>
            )}

            {(sections?.sources || (fm.sources && fm.sources.length > 0)) && (
              <>
                <div className="mt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }} />
                <div className="mt-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-0.5 h-4 shrink-0" style={{ backgroundColor: "#60a5fa" }} />
                    <span
                      className="text-[10px] font-medium uppercase tracking-widest"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      Sources
                    </span>
                  </div>
                  {sections?.sources && (
                    <div className="text-[15px] leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa" }}>
                              {children}
                            </a>
                          ),
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          li: ({ children }) => <li className="text-[15px]">{children}</li>,
                          ul: ({ children }) => <ul className="list-disc ml-5 space-y-1">{children}</ul>,
                        }}
                      >
                        {sections.sources}
                      </ReactMarkdown>
                    </div>
                  )}
                  {fm.sources && fm.sources.length > 0 && (
                    <SourceCards sources={fm.sources} />
                  )}
                </div>
              </>
            )}

            <div className="mt-12 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />
            <p className="text-[11px] text-center py-2" style={{ color: "rgba(255,255,255,0.2)" }}>
              Generated by SCOUT · Dossier v{version} · {generatedAt ?? "—"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
