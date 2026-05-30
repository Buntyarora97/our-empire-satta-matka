---
name: Our Empire APK fixes
description: Critical fixes applied to stop the APK from crashing on open
---

## Rule
`newArchEnabled` must be `false` in `artifacts/mobile/app.json`. Setting it to `true` causes the APK to crash immediately on open because some native dependencies don't support the new React Native architecture.

**Why:** App was crashing silently on start. The new arch + packages like expo-glass-effect caused native bridge failures.

**How to apply:** Keep `"newArchEnabled": false` in app.json. Do not re-enable without testing all native packages.

---

## Rule
`play.tsx` market filter must use `m.status === "active"`, not `m.isActive`.

**Why:** The Market schema from the API returns `status: string` and `isBettingOpen: boolean`. There is no `isActive` field. The old filter caused ALL markets to be filtered out on the Play tab.

---

## Rule
Home screen results chip must use `r.openNumber`, `r.jodiNumber`, `r.closeNumber` — NOT `r.openResult`, `r.jodiResult`, `r.closeResult`.

**Why:** The `Result` interface in the generated API schema uses `openNumber/closeNumber/jodiNumber`. The old field names don't exist and caused the chips to show all `*` placeholders.
