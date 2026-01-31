import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { AuthProvider } from './components/AuthProvider';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';
import TeamsLogin from './pages/TeamsLogin';
import TeamsDashboard from './pages/TeamsDashboard';

// Protected route wrapper for admin
function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><Navigate to="/admin" replace /></SignedOut>
    </>
  );
}

// Protected route wrapper for teams
function TeamsRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><Navigate to="/teams" replace /></SignedOut>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/teams" element={<TeamsLogin />} />
          <Route path="/teams/dashboard" element={<TeamsRoute><TeamsDashboard /></TeamsRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
