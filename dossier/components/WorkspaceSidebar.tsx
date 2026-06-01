"use client";

import { useEffect, useState } from "react";

interface CrewMember {
  name: string;
  role: string;
  status: string;
  emoji: string;
  agentId: string | null;
}

interface Stats {
  crewCount: number;
  crewMembers: CrewMember[];
  artifactCount: number;
  lastMemoryDate: string | null;
  activeCases: number;
}

export function WorkspaceSidebar() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/workspace-stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: "#0f2236", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <p
        className="text-[10px] font-medium uppercase tracking-widest mb-4"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        Workspace
      </p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-5 rounded animate-pulse"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
            />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-5">
            <StatRow icon="🤖" label="Active agents" value={stats?.crewCount ?? 0} />
            <StatRow icon="📁" label="Artifacts" value={stats?.artifactCount ?? 0} />
            <StatRow icon="🗓️" label="Last session" value={stats?.lastMemoryDate ?? "—"} />
            <StatRow icon="📋" label="Open cases" value={stats?.activeCases ?? 0} />
          </div>

          {stats?.crewMembers && stats.crewMembers.length > 0 && (
            <div className="pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <p
                className="text-[10px] font-medium uppercase tracking-widest mb-3"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                Crew
              </p>
              <div className="space-y-2.5">
                {stats.crewMembers.map((m) => (
                  <div key={m.name} className="flex items-center gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          m.status === "active" ? "#4ade80" : "rgba(255,255,255,0.2)",
                      }}
                    />
                    <span className="text-sm text-white truncate">
                      {m.emoji} {m.name}
                    </span>
                    <span
                      className="text-[11px] ml-auto shrink-0"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-base leading-none w-5 text-center">{icon}</span>
      <span
        className="text-[11px] uppercase tracking-wide flex-1"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        {label}
      </span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}
