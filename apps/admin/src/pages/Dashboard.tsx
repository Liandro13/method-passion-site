import { useState, useEffect, useCallback } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { ACCOMMODATIONS } from '@method-passion/shared';
import { useAuth } from '../hooks/useAuth';
import { getBookings } from '../lib/api';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import StatsCards from '../components/layout/StatsCards';
import AccommodationPanel from '../components/AccommodationPanel';
import BookingsListView from '../components/BookingsListView';
import AccommodationManager from '../components/AccommodationManager';
import InsightsPanel from '../components/InsightsPanel';

type ViewType = 'accommodation' | 'all-bookings' | 'manage-accommodations' | 'insights';

export default function Dashboard() {
  const [activeView, setActiveView] = useState<ViewType>('accommodation');
  const [activeAccommodation, setActiveAccommodation] = useState(0);
  const [stats, setStats] = useState({ pending: 0, todayCheckIns: 0, monthBookings: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLoaded, role, name } = useAuth();
  const { isSignedIn } = useClerkAuth();

  // Load stats
  const loadStats = useCallback(async () => {
    if (!isLoaded || !isSignedIn || role !== 'admin') return;
    try {
      const result = await getBookings();
      if (result.bookings) {
        const bookings = result.bookings;
        const today = new Date().toISOString().split('T')[0];
        const month = new Date().toISOString().slice(0, 7);
        setStats({
          pending: bookings.filter((b: any) => b.status === 'pending').length,
          todayCheckIns: bookings.filter((b: any) => b.check_in === today && b.status === 'confirmed').length,
          monthBookings: bookings.filter((b: any) => b.check_in.startsWith(month) && b.status === 'confirmed').length
        });
      }
    } catch (e) { console.error('Error loading stats:', e); }
  }, [isLoaded, isSignedIn, role]);

  useEffect(() => { if (isSignedIn) loadStats(); }, [loadStats, isSignedIn]);

  const handleNavigate = (view: ViewType, accommodationIndex?: number) => {
    setActiveView(view);
    if (accommodationIndex !== undefined) setActiveAccommodation(accommodationIndex);
  };

  // Show loading while Clerk initializes or if not admin
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-dark">A carregar...</div>
      </div>
    );
  }

  // Show access denied if not admin
  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-dark mb-4">Acesso restrito a administradores.</p>
          <a href="/" className="text-primary hover:underline">← Voltar ao website</a>
        </div>
      </div>
    );
  }

  const currentAcc = ACCOMMODATIONS[activeAccommodation];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header userName={name} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex">
        <Sidebar variant="desktop" activeView={activeView} activeAccommodation={activeAccommodation} 
          pendingCount={stats.pending} onNavigate={handleNavigate} />
        
        {sidebarOpen && (
          <Sidebar variant="mobile" activeView={activeView} activeAccommodation={activeAccommodation}
            pendingCount={stats.pending} onNavigate={handleNavigate} onClose={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 p-4 lg:p-6 overflow-auto pb-20 lg:pb-6">
          <StatsCards 
            todayCheckIns={stats.todayCheckIns} 
            pendingCount={stats.pending} 
            monthBookings={stats.monthBookings}
            onPendingClick={() => setActiveView('all-bookings')} 
          />

          {activeView === 'accommodation' && (
            <AccommodationPanel
              accommodationId={currentAcc.id}
              accommodationName={currentAcc.name}
              onBookingChange={loadStats}
            />
          )}
          {activeView === 'all-bookings' && <BookingsListView onBookingChange={loadStats} showAccommodationFilter />}
          {activeView === 'manage-accommodations' && <AccommodationManager />}
          {activeView === 'insights' && <InsightsPanel />}
        </main>
      </div>

      <Sidebar variant="bottom" activeView={activeView} activeAccommodation={activeAccommodation}
        pendingCount={stats.pending} onNavigate={handleNavigate} />
    </div>
  );
}
