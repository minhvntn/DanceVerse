import { create } from 'zustand';
import { apiClient, setAuthInterceptors } from '../services/apiClient';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarType: string;
  avatarConfig?: any;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  status: 'initializing' | 'authenticated' | 'guest' | 'unauthenticated';
  
  initializeAuth: () => Promise<void>;
  register: (data: any) => Promise<void>;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  setAccessToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const setAccessToken = (token: string | null) => {
    set({ accessToken: token });
  };

  const refreshTokens = async (): Promise<string | null> => {
    try {
      const response = await apiClient.post('/auth/refresh');
      setAccessToken(response.accessToken);
      set({ user: response.user, status: 'authenticated' });
      return response.accessToken;
    } catch (e) {
      setAccessToken(null);
      set({ user: null, status: 'unauthenticated' });
      return null;
    }
  };

  // Connect apiClient to our store for interceptors
  setAuthInterceptors(
    () => get().accessToken,
    setAccessToken,
    refreshTokens
  );

  return {
    user: null,
    accessToken: null,
    status: 'initializing',

    setAccessToken,

    initializeAuth: async () => {
      try {
        await refreshTokens();
      } catch (e) {
        set({ status: 'unauthenticated' });
      }
    },

    register: async (data: any) => {
      await apiClient.post('/auth/register', data);
      await get().login({ emailOrUsername: data.email, password: data.password });
    },

    login: async (data: any) => {
      const response = await apiClient.post('/auth/login', data);
      set({ user: response.user, accessToken: response.accessToken, status: 'authenticated' });
    },

    logout: async () => {
      try {
        await apiClient.post('/auth/logout');
      } catch (e) {}
      set({ user: null, accessToken: null, status: 'unauthenticated' });
    },

    continueAsGuest: () => {
      set({ status: 'guest' });
    }
  };
});
