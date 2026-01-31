import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthTokenGetter } from '../lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    // Set the auth token getter for API calls
    setAuthTokenGetter(async () => {
      try {
        const token = await getToken();
        return token;
      } catch {
        return null;
      }
    });
  }, [getToken]);

  return <>{children}</>;
}
