import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserButton, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import { getBookings } from '../hooks/useBookings';
import TeamAccommodationPanel from '../components/TeamAccommodationPanel';
import TeamBookingsListView from '../components/TeamBookingsListView';
import { ACCOMMODATIONS } from '../constants';

type ViewType = 'accommodation' | 'all-bookings';

export default function TeamsDashboard() {
  const [activeView, setActiveView] = useState<ViewType>('accommodation');
  const [activeAccommodationIndex, setActiveAccommodationIndex] = useState(0);
  const [todayCheckIns, setTodayCheckIns] = useState(0);
  const [monthBookings, setMonthBookings] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLoaded, role, name, allowedAccommodations } = useAuth();
  const { isSignedIn, getToken } = useClerkAuth();
  const navigate = useNavigate();

  // Filter accommodations to only show allowed ones
  const accommodations = ACCOMMODATIONS.filter(acc => allowedAccommodations.includes(acc.id));

  // Check role and redirect if not team or admin
  useEffect(() => {
    if (isLoaded && role !== 'team' && role !== 'admin') {
      navigate('/teams');
    }
  }, [isLoaded, role, navigate]);

  // Load stats (only counts, no financial data)
  const loadStats = useCallback(async () => {
    if (!isLoaded || !isSignedIn || (role !== 'team' && role !== 'admin')) return;

    try {
      const result = await getBookings(getToken);
      if (result.bookings) {
        const bookings = result.bookings;
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().toISOString().slice(0, 7);

        // Check-ins hoje (apenas confirmados e dos alojamentos permitidos)
        setTodayCheckIns(bookings.filter((b) => 
          b.check_in === today && 
          b.status === 'confirmed' &&
          allowedAccommodations.includes(b.accommodation_id)
        ).length);
        
        // Reservas do mês (confirmadas e dos alojamentos permitidos)
        setMonthBookings(bookings.filter((b) => 
          b.check_in.startsWith(currentMonth) && 
          b.status === 'confirmed' &&
          allowedAccommodations.includes(b.accommodation_id)
        ).length);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [isLoaded, isSignedIn, role, allowedAccommodations, getToken]);

  useEffect(() => {
    if (isSignedIn) loadStats();
  }, [loadStats, isSignedIn]);

  if (!isLoaded || (role !== 'team' && role !== 'admin')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-dark">A carregar...</div>
      </div>
    );
  }

  if (accommodations.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="bg-dark text-white shadow-lg z-20">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/images/logo.jpeg" 
                alt="Logo" 
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <h1 className="text-lg font-bold">Method & Passion</h1>
                <p className="text-xs opacity-80">Portal de Equipas</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm opacity-80 hidden sm:block">{name}</span>
              <UserButton afterSignOutUrl="/teams" />
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-xl font-semibold text-dark mb-2">Sem Acesso a Alojamentos</h2>
            <p className="text-gray-600">
              Não tens alojamentos atribuídos à tua conta. 
              Contacta o administrador para configurar o acesso.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentAccommodation = accommodations[activeAccommodationIndex] || accommodations[0];

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
                src="/images/logo.jpeg" 
                alt="Logo" 
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <h1 className="text-lg font-bold">Method & Passion</h1>
                <p className="text-xs opacity-80">Portal de Equipas</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-80 hidden sm:block">{name}</span>
            <UserButton afterSignOutUrl="/teams" />
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
                  setActiveAccommodationIndex(index);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeView === 'accommodation' && activeAccommodationIndex === index
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
              onClick={() => setActiveView('all-bookings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === 'all-bookings'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>📋</span>
              <span className="font-medium text-sm">Todas Reservas</span>
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
                      setActiveAccommodationIndex(index);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeView === 'accommodation' && activeAccommodationIndex === index
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
                    setActiveView('all-bookings');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeView === 'all-bookings'
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>📋</span>
                  <span className="font-medium">Todas Reservas</span>
                </button>
              </nav>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto pb-20 lg:pb-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-2xl lg:text-3xl font-bold text-primary">{todayCheckIns}</div>
              <div className="text-xs lg:text-sm text-gray-500">Check-ins hoje</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-2xl lg:text-3xl font-bold text-green-600">{monthBookings}</div>
              <div className="text-xs lg:text-sm text-gray-500">Reservas este mês</div>
            </div>
          </div>

          {/* Content */}
          {activeView === 'accommodation' && currentAccommodation && (
            <TeamAccommodationPanel
              accommodationId={currentAccommodation.id}
              accommodationName={currentAccommodation.name}
            />
          )}
          {activeView === 'all-bookings' && (
            <TeamBookingsListView 
              allowedAccommodations={allowedAccommodations}
            />
          )}
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
                setActiveAccommodationIndex(index);
              }}
              className={`flex flex-col items-center py-2 px-2 rounded-lg transition-colors ${
                activeView === 'accommodation' && activeAccommodationIndex === index 
                  ? 'text-primary' 
                  : 'text-gray-500'
              }`}
            >
              <span className="text-lg">🏠</span>
              <span className="text-[10px] mt-0.5">{acc.shortName}</span>
            </button>
          ))}
          <button
            onClick={() => setActiveView('all-bookings')}
            className={`flex flex-col items-center py-2 px-2 rounded-lg transition-colors ${
              activeView === 'all-bookings' ? 'text-primary' : 'text-gray-500'
            }`}
          >
            <span className="text-lg">📋</span>
            <span className="text-[10px] mt-0.5">Todas</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
