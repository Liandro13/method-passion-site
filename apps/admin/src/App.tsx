import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react';
import { AuthProvider } from './components/AuthProvider';
import Dashboard from './pages/Dashboard';

function LoginPage() {
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

export default function App() {
  return (
    <BrowserRouter basename="/admin">
      <AuthProvider>
        <SignedOut>
          <LoginPage />
        </SignedOut>
        <SignedIn>
          <Routes>
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </SignedIn>
      </AuthProvider>
    </BrowserRouter>
  );
}
