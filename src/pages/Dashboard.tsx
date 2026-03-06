import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserButton, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import { getBookings, sendBackup } from '../lib/api';
import AccommodationPanel from '../components/AccommodationPanel';
import BookingsListView from '../components/BookingsListView';
import AccommodationManager from '../components/AccommodationManager';
import InsightsPanel from '../components/InsightsPanel';

type ViewType = 'accommodation' | 'all-bookings' | 'manage-accommodations' | 'insights';

const accommodations = [
  { id: 1, name: 'Esperança Terrace', shortName: 'Esperança' },
  { id: 2, name: 'Nattura Gerês Village', shortName: 'Nattura' },
  { id: 3, name: 'Douro & Sabor Escape', shortName: 'Douro' }
];

export default function Dashboard() {
  const [activeView, setActiveView] = useState<ViewType>('accommodation');
  const [activeAccommodation, setActiveAccommodation] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [todayCheckIns, setTodayCheckIns] = useState(0);
  const [monthBookings, setMonthBookings] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { isLoaded, role, name } = useAuth();
  const { isSignedIn } = useClerkAuth();
  const navigate = useNavigate();

  // Handle backup
  const handleBackup = async () => {
    if (backupLoading) return;
    
    setBackupLoading(true);
    setBackupMessage(null);
    
    try {
      const result = await sendBackup();
      if (result.success) {
        setBackupMessage({
          type: 'success',
          text: `Backup enviado! ${result.stats?.bookings || 0} reservas exportadas.`
        });
      } else {
        setBackupMessage({
          type: 'error',
          text: result.error || 'Erro ao enviar backup'
        });
      }
    } catch (error) {
      setBackupMessage({
        type: 'error',
        text: 'Erro de conexão ao enviar backup'
      });
    } finally {
      setBackupLoading(false);
      // Clear message after 5 seconds
      setTimeout(() => setBackupMessage(null), 5000);
    }
  };

  // Check role and redirect if not admin
  useEffect(() => {
    if (isLoaded && role !== 'admin') {
      navigate('/admin');
    }
  }, [isLoaded, role, navigate]);

  // Load stats
  const loadStats = useCallback(async () => {
    if (!isLoaded || !isSignedIn || role !== 'admin') return;

    try {
      const result = await getBookings();
      if (result.bookings) {
        const bookings = result.bookings;
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().toISOString().slice(0, 7);

        // Pendentes
        setPendingCount(bookings.filter((b: { status: string }) => b.status === 'pending').length);
        
        // Check-ins hoje
        setTodayCheckIns(bookings.filter((b: { check_in: string; status: string }) => 
          b.check_in === today && b.status === 'confirmed'
        ).length);
        
        // Reservas do mês (confirmadas)
        setMonthBookings(bookings.filter((b: { check_in: string; status: string }) => 
          b.check_in.startsWith(currentMonth) && b.status === 'confirmed'
        ).length);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [isLoaded, isSignedIn, role]);

  useEffect(() => {
    if (isSignedIn) loadStats();
  }, [loadStats, isSignedIn]);

  const handleBookingChange = () => {
    loadStats();
  };

  if (!isLoaded || role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-dark">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-dark text-white shadow-lg z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Botão hamburger mobile */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <img 
                src="/vite.svg" 
                alt="Logo" 
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <h1 className="text-lg font-bold">Method & Passion</h1>
                <p className="text-xs opacity-80">Admin Dashboard</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-80 hidden sm:block">{name}</span>
            <UserButton afterSignOutUrl="/admin" />
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex w-56 bg-white border-r border-gray-200 flex-col">
          <nav className="flex-1 p-4 space-y-1">
            {/* Alojamentos */}
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2">
              Alojamentos
            </div>
            {accommodations.map((acc, index) => (
              <button
                key={acc.id}
                onClick={() => {
                  setActiveView('accommodation');
                  setActiveAccommodation(index);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeView === 'accommodation' && activeAccommodation === index
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>🏠</span>
                <span className="font-medium text-sm">{acc.shortName}</span>
              </button>
            ))}

            <div className="border-t border-gray-200 my-3" />

            {/* Geral */}
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2">
              Geral
            </div>
            <button
              onClick={() => setActiveView('insights')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === 'insights'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>📊</span>
              <span className="font-medium text-sm">Dashboard</span>
            </button>
            <button
              onClick={() => setActiveView('all-bookings')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                activeView === 'all-bookings'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-3">
                <span>📋</span>
                <span className="font-medium text-sm">Todas Reservas</span>
              </span>
              {pendingCount > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeView === 'all-bookings' ? 'bg-white/20 text-white' : 'bg-yellow-500 text-white'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveView('manage-accommodations')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === 'manage-accommodations'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>🏡</span>
              <span className="font-medium text-sm">Gerir Alojamentos</span>
            </button>
          </nav>
        </aside>

        {/* Sidebar Mobile (overlay) */}
        {sidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white z-40 lg:hidden shadow-xl">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <span className="font-semibold text-dark">Menu</span>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {/* Alojamentos */}
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2">
                  Alojamentos
                </div>
                {accommodations.map((acc, index) => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      setActiveView('accommodation');
                      setActiveAccommodation(index);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeView === 'accommodation' && activeAccommodation === index
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>🏠</span>
                    <span className="font-medium">{acc.shortName}</span>
                  </button>
                ))}

                <div className="border-t border-gray-200 my-3" />

                {/* Geral */}
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2">
                  Geral
                </div>
                <button
                  onClick={() => {
                    setActiveView('insights');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeView === 'insights'
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>📊</span>
                  <span className="font-medium">Dashboard</span>
                </button>
                <button
                  onClick={() => {
                    setActiveView('all-bookings');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    activeView === 'all-bookings'
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span>📋</span>
                    <span className="font-medium">Todas Reservas</span>
                  </span>
                  {pendingCount > 0 && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      activeView === 'all-bookings' ? 'bg-white/20 text-white' : 'bg-yellow-500 text-white'
                    }`}>
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveView('manage-accommodations');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeView === 'manage-accommodations'
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>🏡</span>
                  <span className="font-medium">Gerir Alojamentos</span>
                </button>
              </nav>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto pb-20 lg:pb-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-2xl lg:text-3xl font-bold text-primary">{todayCheckIns}</div>
              <div className="text-xs lg:text-sm text-gray-500">Check-ins hoje</div>
            </div>
            <div 
              className="bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveView('all-bookings')}
            >
              <div className="text-2xl lg:text-3xl font-bold text-yellow-500">{pendingCount}</div>
              <div className="text-xs lg:text-sm text-gray-500">Pendentes</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-2xl lg:text-3xl font-bold text-green-600">{monthBookings}</div>
              <div className="text-xs lg:text-sm text-gray-500">Este mês</div>
            </div>
          </div>

          {/* Content */}
          {activeView === 'accommodation' && (
            <AccommodationPanel
              accommodationId={accommodations[activeAccommodation].id}
              accommodationName={accommodations[activeAccommodation].name}
              onBookingChange={handleBookingChange}
            />
          )}
          {activeView === 'all-bookings' && (
            <BookingsListView 
              onBookingChange={handleBookingChange}
              showAccommodationFilter={true}
            />
          )}
          {activeView === 'manage-accommodations' && <AccommodationManager />}
          {activeView === 'insights' && <InsightsPanel />}
        </main>
      </div>

      {/* Bottom Navigation Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
        <div className="flex justify-around py-2">
          {accommodations.map((acc, index) => (
            <button
              key={acc.id}
              onClick={() => {
                setActiveView('accommodation');
                setActiveAccommodation(index);
              }}
              className={`flex flex-col items-center py-2 px-2 rounded-lg transition-colors ${
                activeView === 'accommodation' && activeAccommodation === index 
                  ? 'text-primary' 
                  : 'text-gray-500'
              }`}
            >
              <span className="text-lg">🏠</span>
              <span className="text-[10px] mt-0.5">{acc.shortName}</span>
            </button>
          ))}
          <button
            onClick={() => setActiveView('insights')}
            className={`flex flex-col items-center py-2 px-2 rounded-lg transition-colors ${
              activeView === 'insights' ? 'text-primary' : 'text-gray-500'
            }`}
          >
            <span className="text-lg">📊</span>
            <span className="text-[10px] mt-0.5">Stats</span>
          </button>
          <button
            onClick={() => setActiveView('all-bookings')}
            className={`flex flex-col items-center py-2 px-2 rounded-lg transition-colors relative ${
              activeView === 'all-bookings' ? 'text-primary' : 'text-gray-500'
            }`}
          >
            <span className="text-lg">📋</span>
            <span className="text-[10px] mt-0.5">Todas</span>
            {pendingCount > 0 && (
              <span className="absolute top-1 right-0 px-1 py-0.5 text-[8px] bg-yellow-500 text-white rounded-full min-w-[14px] text-center">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveView('manage-accommodations')}
            className={`flex flex-col items-center py-2 px-2 rounded-lg transition-colors ${
              activeView === 'manage-accommodations' ? 'text-primary' : 'text-gray-500'
            }`}
          >
            <span className="text-lg">🏡</span>
            <span className="text-[10px] mt-0.5">Gerir</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
