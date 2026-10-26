// Builds the Kimi OAuth authorize URL (same flow the scaffolded Login page used).
export function getKimiOAuthUrl(): string {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL as string | undefined;
  const appID = import.meta.env.VITE_APP_ID as string | undefined;
  if (!kimiAuthUrl || !appID) return '';
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);
  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set('client_id', appID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'profile');
  url.searchParams.set('state', state);
  return url.toString();
}
