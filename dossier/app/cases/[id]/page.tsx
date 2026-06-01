"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/time";
import { Trash2, GripVertical, Pencil } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Case {
  id: string;
  name: string;
  intent: string | null;
  status: string;
  created_at: number;
  updated_at: number;
}

interface Category {
  id: string;
  type: string;
  label: string;
  value: string;
  sort_order: number;
}

interface Version {
  id: string;
  version_number: number;
  status: string;
  created_at: number;
  triggered_at: number | null;
  completed_at: number | null;
  results_path: string | null;
}

type SaveState = "idle" | "saving" | "saved";

const CATEGORY_TYPES = [
  "intent",
  "company",
  "individual",
  "time_range",
  "topic",
  "keyword",
  "link",
  "exclusion",
];

const TYPE_LABELS: Record<string, string> = {
  intent: "Intent",
  company: "Company",
  individual: "Individual",
  time_range: "Time Range",
  topic: "Topic",
  keyword: "Keyword",
  link: "Link",
  exclusion: "Exclusion",
};

// ─── Status Chip ──────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: string }) {
  if (status === "running") {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium"
        style={{ backgroundColor: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Running
      </span>
    );
  }
  if (status === "ready" || status === "complete") {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium"
        style={{ backgroundColor: "rgba(74,222,128,0.12)", color: "#4ade80" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        Ready
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}
    >
      Draft
    </span>
  );
}

// ─── Inline Edit Field ────────────────────────────────────────────────────────

function InlineEdit({
  value,
  onSave,
  className,
  placeholder,
  multiline = false,
}: {
  value: string;
  onSave: (v: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft.trim());
  };

  const inputStyle = {
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(96,165,250,0.5)",
    color: "white",
    borderRadius: "6px",
    padding: "2px 8px",
    outline: "none",
    width: "100%",
  };

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          placeholder={placeholder}
          rows={2}
          className={`resize-none text-sm ${className}`}
          style={inputStyle}
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        placeholder={placeholder}
        className={`text-sm ${className}`}
        style={inputStyle}
      />
    );
  }

  return (
    <span
      className={`group flex items-center gap-1.5 cursor-text ${className}`}
      onClick={() => setEditing(true)}
    >
      <span style={!value ? { color: "rgba(255,255,255,0.3)", fontStyle: "italic" } : {}}>
        {value || placeholder || "—"}
      </span>
      <Pencil
        size={12}
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        style={{ color: "rgba(255,255,255,0.3)" }}
      />
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [versionSaving, setVersionSaving] = useState(false);
  const [runState, setRunState] = useState<"idle" | "triggering" | "running">("idle");
  const [addingType, setAddingType] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveStateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAll = useCallback(async () => {
    const res = await fetch(`/api/cases/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setCaseData(data.case);
    setCategories(data.categories ?? []);
    setVersions(data.versions ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const runningVersions = versions.filter((v) => v.status === "running");
    if (runningVersions.length === 0) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      const running = versions.filter((v) => v.status === "running");
      if (running.length === 0) { clearInterval(pollRef.current!); pollRef.current = null; return; }
      for (const v of running) {
        const res = await fetch(`/api/cases/${id}/versions/${v.id}/status`);
        if (!res.ok) continue;
        const data = await res.json();
        if (data.status !== v.status) {
          setVersions((prev) =>
            prev.map((x) =>
              x.id === v.id
                ? { ...x, status: data.status, completed_at: data.completed_at, results_path: data.results_path }
                : x
            )
          );
          if (data.status !== "running") setRunState("idle");
        }
      }
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id, versions]);

  const triggerAutoSave = useCallback(
    (cats: Category[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setSaveState("saving");
        await fetch(`/api/cases/${id}/categories`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categories: cats }),
        });
        setSaveState("saved");
        if (saveStateTimerRef.current) clearTimeout(saveStateTimerRef.current);
        saveStateTimerRef.current = setTimeout(() => setSaveState("idle"), 2500);
      }, 800);
    },
    [id]
  );

  const updateCategories = useCallback(
    (newCats: Category[]) => {
      setCategories(newCats);
      triggerAutoSave(newCats);
    },
    [triggerAutoSave]
  );

  const saveCaseField = async (field: "name" | "intent", value: string) => {
    const res = await fetch(`/api/cases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      const data = await res.json();
      setCaseData(data.case);
    }
  };

  const saveVersion = async () => {
    setVersionSaving(true);
    const res = await fetch(`/api/cases/${id}/versions`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setVersions((prev) => [data.version, ...prev]);
    }
    setVersionSaving(false);
  };

  const latestVersion = versions[0];

  const runScout = async () => {
    if (!latestVersion || latestVersion.status === "running") return;
    setRunState("triggering");
    const res = await fetch(`/api/cases/${id}/versions/${latestVersion.id}/run`, { method: "POST" });
    if (res.ok) {
      setRunState("running");
      setVersions((prev) =>
        prev.map((v) => (v.id === latestVersion.id ? { ...v, status: "running" } : v))
      );
    } else {
      setRunState("idle");
    }
  };

  const updateCatValue = (catId: string, value: string) =>
    updateCategories(categories.map((c) => (c.id === catId ? { ...c, value } : c)));

  const updateCatLabel = (catId: string, label: string) =>
    updateCategories(categories.map((c) => (c.id === catId ? { ...c, label } : c)));

  const deleteCategory = (catId: string) =>
    updateCategories(categories.filter((c) => c.id !== catId));

  const addCategory = () => {
    const type = addingType ?? "topic";
    const newCat: Category = {
      id: crypto.randomUUID(),
      type,
      label: TYPE_LABELS[type] ?? type,
      value: "",
      sort_order: categories.length,
    };
    setAddingType(null);
    updateCategories([...categories, newCat]);
  };

  const isRunning = runState === "running" || latestVersion?.status === "running";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0d1b2a" }}>
        <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Loading…</span>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0d1b2a" }}>
        <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Case not found.</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 md:pb-0" style={{ backgroundColor: "#0d1b2a" }}>
      {/* Nav */}
      <header
        className="sticky top-0 z-10"
        style={{ backgroundColor: "#0d1b2a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <Link href="/" className="font-semibold tracking-tight text-white text-lg">
            Dossier
          </Link>
          <span className="text-lg font-light" style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
          <Link href="/" className="text-sm transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
            Cases
          </Link>
          <span className="text-lg font-light" style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
          <span className="text-sm font-medium text-white truncate max-w-[300px]">
            {caseData.name}
          </span>

          <div className="ml-auto">
            {saveState === "saving" && (
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Saving…</span>
            )}
            {saveState === "saved" && (
              <span className="text-xs" style={{ color: "#4ade80" }}>Saved</span>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* ── Main column ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Case header */}
            <div className="space-y-1.5">
              <InlineEdit
                value={caseData.name}
                onSave={(v) => saveCaseField("name", v)}
                className="text-2xl font-semibold text-white leading-tight"
                placeholder="Case name"
              />
              <InlineEdit
                value={caseData.intent ?? ""}
                onSave={(v) => saveCaseField("intent", v)}
                className="text-sm"
                placeholder="Add intent…"
                multiline
              />
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {categories.length} categories
                </span>
                {versions.length > 0 && (
                  <>
                    <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                      v{versions[0].version_number}
                    </span>
                  </>
                )}
                {caseData.updated_at && (
                  <>
                    <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                      Last saved {formatDistanceToNow(caseData.updated_at)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Category editor */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: "#0f2236", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="px-5 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Research Categories
                </p>
              </div>

              <div style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {categories.length === 0 && (
                  <div className="px-5 py-8 text-center text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
                    No categories yet — add one below.
                  </div>
                )}
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-start gap-3 px-4 py-3 group"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                  >
                    <GripVertical
                      size={16}
                      className="mt-1 shrink-0 cursor-grab"
                      style={{ color: "rgba(255,255,255,0.15)" }}
                    />
                    <div className="w-28 shrink-0 pt-0.5">
                      <InlineEdit
                        value={cat.label}
                        onSave={(v) => updateCatLabel(cat.id, v)}
                        className="text-[11px] font-medium uppercase tracking-wide"
                      />
                    </div>
                    <textarea
                      value={cat.value}
                      onChange={(e) => updateCatValue(cat.id, e.target.value)}
                      placeholder="Enter value…"
                      rows={2}
                      className="flex-1 resize-none text-sm text-white placeholder:text-white/25 bg-transparent outline-none rounded-md px-2 py-1 transition-colors"
                      style={{ border: "1px solid transparent" }}
                      onFocus={(e) => (e.target.style.border = "1px solid rgba(96,165,250,0.3)")}
                      onBlur={(e) => (e.target.style.border = "1px solid transparent")}
                    />
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                      style={{ color: "rgba(255,255,255,0.2)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add category */}
              <div
                className="px-5 py-3 flex items-center gap-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
              >
                {addingType === null ? (
                  <button
                    onClick={() => setAddingType("topic")}
                    className="text-sm font-medium transition-colors"
                    style={{ color: "#60a5fa" }}
                  >
                    + Add field
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <select
                      value={addingType}
                      onChange={(e) => setAddingType(e.target.value)}
                      className="text-sm rounded-lg px-2 py-1 outline-none"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "white",
                      }}
                    >
                      {CATEGORY_TYPES.map((t) => (
                        <option key={t} value={t} style={{ backgroundColor: "#0f2236" }}>
                          {TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={addCategory}
                      className="text-sm rounded-lg px-3 py-1 font-medium transition-all"
                      style={{ backgroundColor: "#60a5fa", color: "#0d1b2a" }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setAddingType(null)}
                      className="text-sm transition-colors"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-3">
              <button
                onClick={saveVersion}
                disabled={versionSaving}
                className="rounded-full px-5 py-2 text-sm font-medium transition-all"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  opacity: versionSaving ? 0.5 : 1,
                }}
              >
                {versionSaving ? "Saving…" : "Save Version"}
              </button>

              <button
                onClick={runScout}
                disabled={!latestVersion || isRunning || runState === "triggering"}
                className="rounded-full px-5 py-2 text-sm font-semibold transition-all flex items-center gap-2"
                style={{
                  backgroundColor: "#f59e0b",
                  color: "#0d1b2a",
                  opacity: !latestVersion || isRunning || runState === "triggering" ? 0.5 : 1,
                }}
              >
                {isRunning ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-900 animate-pulse" />
                    Running…
                  </>
                ) : runState === "triggering" ? (
                  "Triggering…"
                ) : (
                  "Run SCOUT →"
                )}
              </button>

              {!latestVersion && (
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Save a version first to run SCOUT
                </span>
              )}
            </div>
          </div>

          {/* ── Version sidebar ── */}
          <div className="w-full md:w-72 md:shrink-0 md:sticky md:top-20">
            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: "#0f2236", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p
                className="text-[10px] font-medium uppercase tracking-widest mb-4"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                Version History
              </p>

              {versions.length === 0 ? (
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                  No versions yet — click &ldquo;Save Version&rdquo; to snapshot.
                </p>
              ) : (
                <div className="space-y-2">
                  {versions.map((v, i) => {
                    const isCurrent = i === 0;
                    return (
                      <div
                        key={v.id}
                        className="rounded-xl px-3 py-2.5"
                        style={{
                          backgroundColor: isCurrent ? "rgba(96,165,250,0.08)" : "rgba(255,255,255,0.02)",
                          borderLeft: isCurrent ? "2px solid #60a5fa" : "2px solid transparent",
                          border: isCurrent ? undefined : "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-white">
                            v{v.version_number}
                          </span>
                          <StatusChip status={v.status} />
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                          {formatDistanceToNow(v.created_at)}
                        </p>
                        {(v.status === "ready" || v.status === "complete") && (
                          <p className="mt-1">
                            <Link
                              href={`/cases/${id}/results/${v.version_number}`}
                              className="text-[11px] font-medium transition-colors"
                              style={{ color: "#60a5fa" }}
                            >
                              View Results →
                            </Link>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
