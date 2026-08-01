import React, { useEffect } from 'react';
import { useGameStore } from './stores/useGameStore';
import { useAuthStore } from './stores/useAuthStore';
import { useRoomStore } from './stores/useRoomStore';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AvatarSelectPage } from './pages/AvatarSelectPage';
import { LobbyPage } from './pages/LobbyPage';
import { GamePage } from './pages/GamePage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';

export const App: React.FC = () => {
  const pageStep = useGameStore((state) => state.pageStep);
  const setPageStep = useGameStore((state) => state.setPageStep);
  const setTargetRoomId = useRoomStore((state) => state.setTargetRoomId);

  const authStatus = useAuthStore((state) => state.status);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Auto-redirect after auth restore on F5
  useEffect(() => {
    if (authStatus === 'authenticated' && pageStep === 'landing') {
      // User was authenticated via refresh token — skip landing, go to avatar select
      setPageStep('avatar');
    }
  }, [authStatus, pageStep, setPageStep]);

  useEffect(() => {
    // Check if URL is /auth/callback
    try {
      const url = new URL(window.location.href);
      if (url.pathname === '/auth/callback') {
        setPageStep('oauth');
        return; // Don't process room params if we're doing oauth
      }

      const roomParam = url.searchParams.get('room') || url.searchParams.get('invite');
      if (roomParam) {
        setTargetRoomId(roomParam);
      } else if (url.pathname.startsWith('/room/')) {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts[1]) {
          setTargetRoomId(parts[1]);
        }
      }
    } catch {
      // ignore parsing error
    }
  }, [setTargetRoomId, setPageStep]);

  // Show loading screen while auth is initializing
  if (authStatus === 'initializing') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm tracking-wide animate-pulse">Loading DanceVerse Live...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {pageStep === 'landing' && <LandingPage />}
      {pageStep === 'login' && <LoginPage />}
      {pageStep === 'register' && <RegisterPage />}
      {pageStep === 'avatar' && <AvatarSelectPage />}
      {pageStep === 'lobby' && <LobbyPage />}
      {pageStep === 'game' && <GamePage />}
      {pageStep === 'oauth' && <OAuthCallbackPage />}
    </div>
  );
};

export default App;
