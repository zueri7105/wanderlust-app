# WanderLust combined location + authentication update

This project combines the worldwide place-search/location-pin/flight-route changes with Supabase login, account settings, and Google identity linking.

## Important prerequisites

1. Create a Supabase project (free tier subject to quotas).
2. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify's environment variables. Do not commit secret keys.
3. Run supabase/schema.sql in Supabase SQL editor and review row-level security policies before inviting users.
4. Configure Supabase Auth URL/redirect allowlist for your deployed domain, Google OAuth provider, and the Google Cloud OAuth callback URL specified by Supabase.
5. Enable **manual identity linking** in Supabase Auth configuration. Linking an existing Google identity associated with another Supabase user will not automatically merge users.
6. Test with disposable accounts: email signup/confirmation, Google OAuth, link, unlink, password reset, session persistence, user isolation, itinerary saving and reloading.
7. Test worldwide search for Dubrovnik Airport and Toledo bus station against live geocoding endpoints and verify selected pin coordinates survive reload and device switching.

## Deploy safely

Do not copy a .git folder into an existing repository. Back up the existing repo, copy only changed files from the patch, review diffs, build and test, then commit and push. The complete archive is a project source backup, not a Git-initialized repository.

## Verification limits

Archive integrity and source presence checked. Full npm build and live Supabase/Google OAuth/location API integration tests have NOT been completed in this environment. Some existing localStorage-backed data and media may still require cloud migration for complete cross-device synchronization. Public OSM services have rate limits and variable place coverage; this is not Google Maps parity.
