import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignIn, useUser } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';

export default function TeamsLogin() {
  const { isSignedIn } = useUser();
  const { role, isLoaded } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already signed in with team or admin access
  useEffect(() => {
    if (isLoaded && isSignedIn && (role === 'team' || role === 'admin')) {
      navigate('/teams/dashboard');
    }
  }, [isLoaded, isSignedIn, role, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-dark text-white py-4 px-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-xl font-bold">Method & Passion</h1>
          <p className="text-sm opacity-80">Portal de Equipas</p>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">👥</div>
            <h2 className="text-xl font-semibold text-dark">Acesso Equipas</h2>
            <p className="text-sm text-gray-500">Limpeza e Receção</p>
          </div>

          <SignIn 
            routing="hash"
            signUpUrl={undefined}
            afterSignInUrl="/teams/dashboard"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-lg rounded-xl',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'hidden',
                dividerRow: 'hidden',
                formButtonPrimary: 'bg-primary hover:bg-primary/90 text-dark',
              }
            }}
          />

          <p className="text-center text-sm text-gray-500 mt-4">
            Este acesso é apenas para membros da equipa.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white py-4 text-center text-sm opacity-80">
        © 2026 Method & Passion
      </footer>
    </div>
  );
}
