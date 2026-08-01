import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useGameStore } from '../stores/useGameStore';
import { Sparkles, AlertCircle } from 'lucide-react';
import { socketService } from '../services/socket.service';

export const OAuthCallbackPage: React.FC = () => {
  const [error, setError] = React.useState<string | null>(null);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const setPageStep = useGameStore((state) => state.setPageStep);
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    const returnTo = params.get('returnTo');
    const linked = params.get('linked');

    if (err) {
      setError(getErrorMessage(err));
      return;
    }

    if (linked) {
      // Just linked an account from security settings
      if (returnTo) {
        window.location.assign(returnTo);
      } else {
        setPageStep('landing');
      }
      return;
    }

    // Refresh session to get access token from HTTP-only cookie
    initializeAuth()
      .then(() => {
        // Force reconnect socket with new auth
        socketService.disconnect();
        socketService.connect();
        
        if (returnTo && returnTo !== '/') {
          window.location.assign(returnTo); // Redirect back to room if needed
        } else {
          setPageStep('avatar');
        }
      })
      .catch((e: any) => {
        console.error('Failed to get session after OAuth:', e);
        setError('Failed to complete sign in. Please try again.');
      });
  }, [initializeAuth, setPageStep]);

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'oauth_cancelled': return 'Sign in was cancelled.';
      case 'missing_code_or_state': return 'Invalid request from provider.';
      case 'oauth_state_invalid': return 'Session expired or invalid. Please try again.';
      case 'email_conflict': return 'An account with this email already exists. Please sign in with your password to link your accounts.';
      case 'account_already_linked': return 'This social account is already linked to another user.';
      default: return 'An unexpected error occurred during sign in.';
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 overflow-hidden">
      <div className="z-10 flex flex-col items-center max-w-sm w-full px-6 py-10 glass-panel rounded-3xl shadow-2xl border border-white/10 text-center">
        {error ? (
          <>
            <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Sign In Failed</h2>
            <p className="text-sm text-slate-300 mb-6">{error}</p>
            <button
              onClick={() => setPageStep('login')}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
            >
              Return to Login
            </button>
          </>
        ) : (
          <>
            <Sparkles className="w-12 h-12 text-neon-blue animate-spin mb-4" style={{ animationDuration: '3s' }} />
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-purple-400 mb-2">
              Completing Sign In...
            </h2>
            <p className="text-sm text-slate-400">Please wait while we set up your profile.</p>
          </>
        )}
      </div>
    </div>
  );
};
