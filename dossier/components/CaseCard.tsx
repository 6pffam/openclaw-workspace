"use client";

import Link from "next/link";
import { formatDistanceToNow } from "@/lib/time";

interface Case {
  id: string;
  name: string;
  intent: string | null;
  status: string;
  version_status: string | null;
  latest_version: number | null;
  created_at: number;
  updated_at: number;
}

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

export function CaseCard({ case: c }: { case: Case }) {
  const effectiveStatus = c.version_status ?? c.status;

  return (
    <div
      className="rounded-xl px-4 md:px-5 py-4 transition-all"
      style={{
        backgroundColor: "#0f2236",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-medium text-white text-sm leading-snug">
          {c.name}
        </span>
        <StatusChip status={effectiveStatus} />
      </div>

      {c.intent && (
        <p className="mt-1.5 text-sm truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
          {c.intent}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          Updated {formatDistanceToNow(c.updated_at)}
        </span>
        <Link
          href={`/cases/${c.id}`}
          className="text-sm font-medium transition-colors"
          style={{ color: "#60a5fa" }}
        >
          Open →
        </Link>
      </div>
    </div>
  );
}
