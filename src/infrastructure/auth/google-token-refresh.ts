type RefreshSuccess = {
  accessToken: string;
  expiresAt: number;
  error: undefined;
};

type RefreshFailure = {
  error: 'RefreshTokenError';
};

type RefreshResult = RefreshSuccess | RefreshFailure;

export async function refreshGoogleAccessToken(
  refreshToken: string,
): Promise<RefreshResult> {
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;

  if (!clientId || !clientSecret) {
    return { error: 'RefreshTokenError' };
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    return { error: 'RefreshTokenError' };
  }

  const tokens = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  return {
    accessToken: tokens.access_token,
    expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
    error: undefined,
  };
}
