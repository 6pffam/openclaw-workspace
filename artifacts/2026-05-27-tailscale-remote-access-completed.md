# Tailscale Remote Access

**Status:** COMPLETE
**Started:** 2026-05-27
**Goal:** Access Nexus from anywhere (5G, abroad) via Tailscale private network. No port forwarding, no public exposure.

---

## Phase 1 — Mac Mini Setup

- [x] Install Tailscale via Homebrew
- [x] Start Tailscale and authenticate (get login URL)
- [x] Confirm Mac mini has a Tailscale IP

## Phase 2 — iPhone Setup

- [x] Kone installs Tailscale on iPhone (App Store)
- [x] Kone logs in with same account on iPhone
- [x] Confirm phone can reach Mac mini Tailscale IP

## Phase 3 — Nexus Access

- [x] Confirm Nexus reachable at http://<tailscale-ip>:3000 from phone
- [x] Note the permanent Tailscale URL for Kone

## Phase 4 — Optional: OpenClaw via Tailscale

- [x] Confirm OpenClaw gateway reachable at <tailscale-ip>:18789
