import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';
import TeamsLogin from './pages/TeamsLogin';
import TeamsDashboard from './pages/TeamsDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/teams" element={<TeamsLogin />} />
        <Route path="/teams/dashboard" element={<TeamsDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
