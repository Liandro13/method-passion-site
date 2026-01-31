import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import { getBookings } from '../lib/api';
import AccommodationPanel from '../components/AccommodationPanel';
import ApprovalsPanel from '../components/ApprovalsPanel';
import TeamsPanel from '../components/TeamsPanel';

type TabType = 'accommodation' | 'approvals' | 'teams';

const accommodations = [
  { id: 1, name: 'Esperança Terrace' },
  { id: 2, name: 'Nattura Gerês Village' },
  { id: 3, name: 'Douro & Sabor Escape' }
];

export default function Dashboard() {
  const [tabType, setTabType] = useState<TabType>('accommodation');
  const [activeAccommodation, setActiveAccommodation] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const { isLoaded, role, name } = useAuth();
  const navigate = useNavigate();

  // Check role and redirect if not admin
  useEffect(() => {
    if (isLoaded && role !== 'admin') {
      navigate('/admin');
    }
  }, [isLoaded, role, navigate]);

  // Load pending count
  useEffect(() => {
    if (isLoaded && role === 'admin') {
      getBookings(undefined, 'pending').then(res => {
        if (res.bookings) setPendingCount(res.bookings.length);
      });
    }
  }, [isLoaded, role]);

  // Refresh pending count when switching tabs
  useEffect(() => {
    if (tabType === 'approvals') {
      getBookings(undefined, 'pending').then(res => {
        if (res.bookings) setPendingCount(res.bookings.length);
      });
    }
  }, [tabType]);

  if (!isLoaded || role !== 'admin') {
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
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-80">{name}</span>
            <UserButton afterSignOutUrl="/admin" />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8 overflow-x-auto">
            {/* Accommodation tabs */}
            {accommodations.map((acc, index) => (
              <button
                key={acc.id}
                onClick={() => {
                  setTabType('accommodation');
                  setActiveAccommodation(index);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  tabType === 'accommodation' && activeAccommodation === index
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-dark hover:border-gray-300'
                }`}
              >
                {acc.name}
              </button>
            ))}
            
            {/* Separator */}
            <div className="border-l border-gray-300 mx-2 self-stretch my-2" />
            
            {/* Approvals tab */}
            <button
              onClick={() => setTabType('approvals')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
                tabType === 'approvals'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-dark hover:border-gray-300'
              }`}
            >
              Aprovações
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
            
            {/* Teams tab */}
            <button
              onClick={() => setTabType('teams')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                tabType === 'teams'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-dark hover:border-gray-300'
              }`}
            >
              Equipas
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {tabType === 'accommodation' && (
          <AccommodationPanel
            accommodationId={accommodations[activeAccommodation].id}
            accommodationName={accommodations[activeAccommodation].name}
          />
        )}
        {tabType === 'approvals' && <ApprovalsPanel />}
        {tabType === 'teams' && <TeamsPanel />}
      </main>
    </div>
  );
}
