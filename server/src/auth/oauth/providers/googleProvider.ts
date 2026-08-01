import { OAuthProviderAdapter, OAuthTokenResult, OAuthProviderIdentity } from '../types';

export const googleProvider: OAuthProviderAdapter = {
  name: 'google',

  getAuthorizationUrl({ state, redirectUri }): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new Error('GOOGLE_CLIENT_ID not configured');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline', // to get refresh token if needed
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  async exchangeCode({ code, redirectUri }): Promise<OAuthTokenResult> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Google OAuth] Exchange error:', err);
      throw new Error('OAUTH_PROVIDER_ERROR');
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      idToken: data.id_token,
      scope: data.scope
    };
  },

  async getIdentity(tokenResult: OAuthTokenResult): Promise<OAuthProviderIdentity> {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenResult.accessToken}`
      }
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Google OAuth] UserInfo error:', err);
      throw new Error('OAUTH_PROFILE_INVALID');
    }

    const profile = await response.json();

    return {
      providerAccountId: profile.sub,
      email: profile.email,
      emailVerified: profile.email_verified,
      displayName: profile.name,
      avatarUrl: profile.picture
    };
  }
};
