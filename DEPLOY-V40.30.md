# Deploy Math12 Hub v40.30.0

1. Back up the current GitHub Pages version.
2. Run `python tools/verify_release.py .` and require `PASS`.
3. Upload the full v40.30 package, including new JS/CSS and `sw.js`.
4. If Arena is used, merge/test `FIRESTORE-ARENA-RULES-V40.26.txt` against the full production Firestore Rules before publishing rules.
5. Open once as Admin, Teacher and Student. Test login, question bank save, one practice attempt, Arena, Hall of Fame and offline reload.
6. In Admin, open the system-health card and export diagnostics if any critical check fails.
7. Troubleshooting: append `?safe=1`. This disables Delta Sync/Performance/UX enhancements but keeps the security bridge and data unchanged.

Do not treat client-side Arena validation as server-verifiable official examination scoring. High-stakes Arena scoring still requires a trusted backend/Cloud Function.
