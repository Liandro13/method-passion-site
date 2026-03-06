import { useAuth } from '@clerk/clerk-react';
import { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();

  return (
    <AuthContext.Provider value={{ getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
