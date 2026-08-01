import { OAuthProviderAdapter, OAuthTokenResult, OAuthProviderIdentity } from '../types';

export const facebookProvider: OAuthProviderAdapter = {
  name: 'facebook',

  getAuthorizationUrl({ state, redirectUri }): string {
    const clientId = process.env.FACEBOOK_APP_ID;
    if (!clientId) throw new Error('FACEBOOK_APP_ID not configured');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      scope: 'email,public_profile',
      response_type: 'code'
    });

    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  },

  async exchangeCode({ code, redirectUri }): Promise<OAuthTokenResult> {
    const clientId = process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Facebook OAuth credentials not configured');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code
    });

    const response = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${params.toString()}`);

    if (!response.ok) {
      const err = await response.text();
      console.error('[Facebook OAuth] Exchange error:', err);
      throw new Error('OAUTH_PROVIDER_ERROR');
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      // Facebook usually doesn't return refresh token in this endpoint directly for standard apps without long-lived exchange
    };
  },

  async getIdentity(tokenResult: OAuthTokenResult): Promise<OAuthProviderIdentity> {
    const params = new URLSearchParams({
      fields: 'id,name,email,picture.type(large)',
      access_token: tokenResult.accessToken
    });

    const response = await fetch(`https://graph.facebook.com/v19.0/me?${params.toString()}`);

    if (!response.ok) {
      const err = await response.text();
      console.error('[Facebook OAuth] UserInfo error:', err);
      throw new Error('OAUTH_PROFILE_INVALID');
    }

    const profile = await response.json();

    return {
      providerAccountId: profile.id,
      email: profile.email || undefined,
      emailVerified: !!profile.email, // Facebook emails are usually verified, but it could be absent
      displayName: profile.name,
      avatarUrl: profile.picture?.data?.url
    };
  }
};
