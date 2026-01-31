import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAuth, logout } from '../lib/api';
import AccommodationPanel from '../components/AccommodationPanel';

const accommodations = [
  { id: 1, name: 'Esperança Terrace' },
  { id: 2, name: 'Nattura Gerês Village' },
  { id: 3, name: 'Douro & Sabor Escape' }
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth().then(result => {
      if (!result.authenticated) {
        navigate('/admin');
      } else {
        setLoading(false);
      }
    }).catch(() => navigate('/admin'));
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-dark">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-dark text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Method & Passion</h1>
            <p className="text-sm opacity-80">Admin Dashboard</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-primary text-dark rounded-lg hover:bg-primary-light transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {accommodations.map((acc, index) => (
              <button
                key={acc.id}
                onClick={() => setActiveTab(index)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === index
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-dark hover:border-gray-300'
                }`}
              >
                {acc.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <AccommodationPanel
          accommodationId={accommodations[activeTab].id}
          accommodationName={accommodations[activeTab].name}
        />
      </main>
    </div>
  );
}
