export type AuthProvider = 'local' | 'google' | 'facebook';

export interface OAuthIntent {
  type: 'login' | 'link';
  returnTo: string;
  userId?: string;
}

export interface OAuthTokenResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  idToken?: string;
  scope?: string;
}

export interface OAuthProviderIdentity {
  providerAccountId: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  avatarUrl?: string;
}

export interface OAuthProviderAdapter {
  name: 'google' | 'facebook';

  getAuthorizationUrl(input: {
    state: string;
    redirectUri: string;
  }): string;

  exchangeCode(input: {
    code: string;
    redirectUri: string;
  }): Promise<OAuthTokenResult>;

  getIdentity(
    tokenResult: OAuthTokenResult
  ): Promise<OAuthProviderIdentity>;
}
