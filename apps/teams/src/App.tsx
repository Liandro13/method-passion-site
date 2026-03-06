import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { AuthProvider } from './components/AuthProvider';
import TeamsLogin from './pages/TeamsLogin';
import TeamsDashboard from './pages/TeamsDashboard';

// Protected route wrapper for teams
function TeamsRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><Navigate to="/" replace /></SignedOut>
    </>
  );
}

function App() {
  return (
    <BrowserRouter basename="/teams">
      <AuthProvider>
        <Routes>
          <Route path="/" element={<TeamsLogin />} />
          <Route path="/dashboard" element={<TeamsRoute><TeamsDashboard /></TeamsRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
