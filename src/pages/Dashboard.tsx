import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import { getBookings } from '../lib/api';
import CalendarView from '../components/CalendarView';
import BookingsListView from '../components/BookingsListView';
import TeamsPanel from '../components/TeamsPanel';

type ViewType = 'calendar' | 'bookings' | 'teams';

export default function Dashboard() {
  const [activeView, setActiveView] = useState<ViewType>('calendar');
  const [pendingCount, setPendingCount] = useState(0);
  const [todayCheckIns, setTodayCheckIns] = useState(0);
  const [monthBookings, setMonthBookings] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLoaded, role, name } = useAuth();
  const navigate = useNavigate();

  // Check role and redirect if not admin
  useEffect(() => {
    if (isLoaded && role !== 'admin') {
      navigate('/admin');
    }
  }, [isLoaded, role, navigate]);

  // Load stats
  const loadStats = useCallback(async () => {
    if (!isLoaded || role !== 'admin') return;

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
  }, [isLoaded, role]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

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

  const navItems = [
    { id: 'calendar' as ViewType, label: 'Calendário', icon: '📅' },
    { id: 'bookings' as ViewType, label: 'Reservas', icon: '📋', badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'teams' as ViewType, label: 'Equipas', icon: '👥' },
  ];

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
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  activeView === item.id
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </span>
                {item.badge && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    activeView === item.id ? 'bg-white/20 text-white' : 'bg-yellow-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
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
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                      activeView === item.id
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span>{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </span>
                    {item.badge && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        activeView === item.id ? 'bg-white/20 text-white' : 'bg-yellow-500 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
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
              onClick={() => setActiveView('bookings')}
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
          {activeView === 'calendar' && <CalendarView onBookingChange={handleBookingChange} />}
          {activeView === 'bookings' && <BookingsListView onBookingChange={handleBookingChange} />}
          {activeView === 'teams' && <TeamsPanel />}
        </main>
      </div>

      {/* Bottom Navigation Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
        <div className="flex justify-around py-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors relative ${
                activeView === item.id ? 'text-primary' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
              {item.badge && (
                <span className="absolute top-1 right-2 px-1.5 py-0.5 text-xs bg-yellow-500 text-white rounded-full min-w-[18px] text-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
