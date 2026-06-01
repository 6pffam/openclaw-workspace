"use client";

import { useEffect, useState, useCallback } from "react";
import { NewCaseModal } from "@/components/NewCaseModal";
import { CaseCard } from "@/components/CaseCard";
import { WorkspaceSidebar } from "@/components/WorkspaceSidebar";

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

export default function Home() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchCases = useCallback(async () => {
    try {
      const res = await fetch("/api/cases");
      const data = await res.json();
      setCases(data.cases ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleCreated = () => {
    fetchCases();
    setModalOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0d1b2a" }}>
      {/* Top nav — desktop only */}
      <header
        className="sticky top-0 z-10"
        style={{ backgroundColor: "#0d1b2a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <span className="font-semibold tracking-tight text-white text-lg">
            📋 Dossier
          </span>
          <nav className="flex items-center gap-6">
            <span className="text-sm font-medium hidden md:block" style={{ color: "rgba(255,255,255,0.5)" }}>
              Cases
            </span>
          </nav>
        </div>
      </header>

      {/* Hero band */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
              Background Intelligence
            </h1>
            <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              {loading ? "…" : `${cases.length} case${cases.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-full text-sm font-semibold transition-all"
            style={{
              backgroundColor: "#f59e0b",
              color: "#0d1b2a",
              padding: "10px 20px",
              minHeight: 44,
            }}
          >
            + New Case
          </button>
        </div>
      </div>

      {/* Content — single column on mobile, sidebar on desktop */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 pb-28 md:pb-16">
        <div className="flex gap-6 items-start">
          {/* Main column */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl h-28 animate-pulse"
                    style={{ backgroundColor: "#0f2236" }}
                  />
                ))}
              </div>
            ) : cases.length === 0 ? (
              <div
                className="rounded-xl flex flex-col items-center justify-center py-16 md:py-20 text-center"
                style={{ backgroundColor: "#0f2236", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="text-4xl mb-4">📋</div>
                <p className="text-white font-medium text-lg">No cases yet</p>
                <p className="text-sm mt-1 mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Create your first background check case
                </p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="rounded-full text-sm font-semibold transition-all"
                  style={{ backgroundColor: "#f59e0b", color: "#0d1b2a", padding: "10px 20px", minHeight: 44 }}
                >
                  Create your first case
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {cases.map((c) => (
                  <CaseCard key={c.id} case={c} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar — desktop only */}
          <div className="hidden md:block w-72 shrink-0">
            <WorkspaceSidebar />
          </div>
        </div>
      </div>

      <NewCaseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
