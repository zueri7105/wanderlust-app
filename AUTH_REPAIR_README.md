# WanderLust authentication repair — integration notes

Use this patch on the **restored `wanderlust-app` repository** with original Git history. Do not create a new `app` repository. Back up the repository before replacing files.

## Changes
- Adds missing `CloudLogin.tsx` with Google OAuth, email sign-in/sign-up and recovery email.
- Connects `CloudGate` to the React root so the app only mounts after the authenticated user's cloud data loads.
- Removes the one-time startup code that erased previously stored browser trips.
- Separates account data by Supabase user ID and backs up browser data before switching accounts.
- Offers an explicit import prompt for existing guest trips; importing replaces cloud trip data (it does **not** merge).
- Syncs allowlisted trip and itinerary data to `user_app_data` using per-user RLS. Saves periodically and on page visibility changes.
- Adds `@supabase/supabase-js` to `package.json`.
- Protects against an undefined `requestIdleCallback` in the startup path.

## Files
`package.json`, `src/main.tsx`, `src/components/CloudLogin.tsx`, `src/components/CloudGate.tsx`, `src/lib/cloudSave.ts`.

## Deployment checklist
1. In your restored repo, copy the patch files to matching paths. **Do not copy `.git` or `.env` files.**
2. Run `npm install` in the repository directory when you have internet access. This also updates `package-lock.json` to include the Supabase dependency; commit the resulting lockfile.
3. Run `npm run check` and `npm run build`. Resolve errors before deploying. Netlify already uses `npm install && npm run build` per `netlify.toml`.
4. Confirm Netlify build environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (publishable key, never secret key).
5. Confirm Supabase `public.user_app_data` has RLS enabled and owner-only policies. Confirm Google OAuth provider and redirect allowlist.
6. Use a test account to verify email sign-up, email verification, Google login, logout, session refresh, password recovery, data saving/reloading and second-device access.
7. Test manual Google identity linking/unlinking in Settings. Supabase manual identity linking must be enabled; never automatically merge two existing accounts.
8. Verify existing guest trips are preserved and import is offered. Test on a **separate test site or deployment preview** before publishing production.

## Known limitations and warnings
- Dependencies could not be installed here because registry.npmjs.org DNS/network access failed. The full TypeScript build and live Supabase/Google tests were therefore **not** completed. Syntax checks passed for all changed TypeScript/TSX files.
- The current cloud sync stores selected allowlisted browser data as a single JSON object. It is not conflict-safe for simultaneous editing on multiple devices (last write wins), and does not upload local image blobs/files. Production multi-device use should add versioning/conflict handling and dedicated file storage.
- Guest import replaces the signed-in account's loaded trips, not a merge. Confirm existing cloud data is expendable before importing.
- Password reset email flow needs an in-app password-update screen for a complete recovery experience; this patch only requests the email.
- The existing app has older authentication/backend components; these were not fully migrated or independently security audited.
- Supabase OAuth and user identity linking require live testing. Do not treat this package as a production-certified release.
