import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignIn, useUser } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';

export default function Admin() {
  const { isSignedIn } = useUser();
  const { role, isLoaded } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already signed in as admin
  useEffect(() => {
    if (isLoaded && isSignedIn && role === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [isLoaded, isSignedIn, role, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-dark">Method & Passion</h1>
          <p className="text-gray-500 mt-2">Admin Panel</p>
        </div>

        <SignIn 
          routing="hash"
          signUpUrl={undefined}
          afterSignInUrl="/admin/dashboard"
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

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-primary hover:underline">
            ← Back to website
          </a>
        </div>
      </div>
    </div>
  );
}
