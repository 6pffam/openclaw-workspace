"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function NewCaseModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [intent, setIntent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => nameRef.current?.focus(), 50);
  }, [open]);

  const reset = () => {
    setName("");
    setIntent("");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Case name is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), intent: intent.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create case.");
        return;
      }
      reset();
      onCreated();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="w-full md:max-w-[500px] rounded-t-2xl md:rounded-2xl p-6"
        style={{ backgroundColor: "#0f2236", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-white">New Case</h2>
          <button
            onClick={handleClose}
            className="text-sm w-7 h-7 flex items-center justify-center rounded-lg transition-all"
            style={{ color: "rgba(255,255,255,0.4)", backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            ✕
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
              Case Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              placeholder="e.g. Acme Corp vendor review"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              disabled={loading}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-all"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
              Intent
            </label>
            <textarea
              placeholder="What are you preparing for? e.g. Renewal negotiation with Acme Corp — need full vendor landscape and decision-maker mapping"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              rows={4}
              disabled={loading}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none resize-none transition-all"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: "#ef4444" }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.55)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-all"
            style={{
              backgroundColor: "#f59e0b",
              color: "#0d1b2a",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Creating…" : "Create Case"}
          </button>
        </div>
      </div>
    </div>
  );
}
