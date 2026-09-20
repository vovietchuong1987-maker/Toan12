# Math12 Hub — Upgrade chain v40.26 → v40.30

## v40.26 — Stability & Security Core
- Firebase runtime bridge for add-on modules.
- Arena trusted-attempt guard.
- Hardened Arena Firestore rules.

## v40.27 — Firestore Delta Sync
- One-time compatibility bootstrap per device/account.
- Later teacher sync writes/deletes only changed documents.
- Legacy sync available through Safe Mode.

## v40.28 — Performance & Smart Loading
- Hall of Fame listener capped to 300 recently active profiles.
- Slimmer PWA pre-cache; heavy avatar images and lazy AI/Reports no longer block install.
- Runtime performance metrics and automatic lazy image decoding.

## v40.29 — UX Pro
- Focus-safe modal behavior, Escape support, skip link and aria-current.
- Mobile touch/input improvements, offline badge, reduced-motion behavior.
- Cleaner Vietnamese labels on student-facing surfaces.

## v40.30 — Production Quality Gate
- Runtime health checks, local error buffer, last-known-good marker.
- Admin diagnostics card/export.
- Safe Mode and release checksum manifest.


## v40.30.1 — Unified Profile Sync Fix
- Avatar no longer hard-codes Level 1 / Tân binh after the student has earned EXP.
- `gamificationV379` is the single display source for Level and Rank across Avatar, dashboard, shop/profile surfaces and Hall of Fame.
- Avatar compatibility payloads mirror the current learning Level/Rank instead of resetting them to starter values.
- Hall of Fame explicitly re-syncs after EXP/reward events.
- Dashboard removes duplicated Level/Rank from the lower EXP strip; the strip now focuses on EXP progress and gold.
- PWA cache revision bumped so GitHub Pages clients receive the fix immediately.
