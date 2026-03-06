import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthTokenGetter } from '../lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      console.log('[AuthProvider] isLoaded:', isLoaded, 'isSignedIn:', isSignedIn);
      setAuthTokenGetter(async () => {
        try {
          const token = await getToken();
          console.log('[AuthProvider] getToken result:', token ? 'got token' : 'no token');
          return token;
        } catch (e) {
          console.error('[AuthProvider] getToken error:', e);
          return null;
        }
      });
      setReady(true);
    }
  }, [getToken, isLoaded, isSignedIn]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-dark">A carregar...</div>
      </div>
    );
  }

  return <>{children}</>;
}
