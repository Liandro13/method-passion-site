import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthTokenGetter } from '../lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setAuthTokenGetter(async () => {
        try {
          return await getToken();
        } catch {
          return null;
        }
      });
      setReady(true);
    }
  }, [getToken, isLoaded]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-dark">A carregar...</div>
      </div>
    );
  }

  return <>{children}</>;
}
