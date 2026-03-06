// Reusable sidebar navigation component
import { ACCOMMODATIONS } from '@method-passion/shared';

type ViewType = 'accommodation' | 'all-bookings' | 'manage-accommodations' | 'insights';

interface NavItem {
  id: ViewType | string;
  icon: string;
  label: string;
  shortLabel?: string;
  badge?: number;
  accommodationIndex?: number;
}

interface SidebarProps {
  activeView: ViewType;
  activeAccommodation: number;
  pendingCount: number;
  onNavigate: (view: ViewType, accommodationIndex?: number) => void;
  variant: 'desktop' | 'mobile' | 'bottom';
  onClose?: () => void;
}

export default function Sidebar({ activeView, activeAccommodation, pendingCount, onNavigate, variant, onClose }: SidebarProps) {
  const handleClick = (view: ViewType, accommodationIndex?: number) => {
    onNavigate(view, accommodationIndex);
    onClose?.();
  };

  const isActive = (view: ViewType, index?: number) => {
    if (view === 'accommodation') {
      return activeView === 'accommodation' && activeAccommodation === index;
    }
    return activeView === view;
  };

  // Bottom navigation (mobile)
  if (variant === 'bottom') {
    return (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
        <div className="flex justify-around py-2">
          {ACCOMMODATIONS.map((acc, index) => (
            <NavButton
              key={acc.id}
              icon="🏠"
              label={acc.shortName}
              active={isActive('accommodation', index)}
              onClick={() => handleClick('accommodation', index)}
              variant="bottom"
            />
          ))}
          <NavButton icon="📊" label="Stats" active={isActive('insights')} 
            onClick={() => handleClick('insights')} variant="bottom" />
          <NavButton icon="📋" label="Todas" active={isActive('all-bookings')} 
            onClick={() => handleClick('all-bookings')} variant="bottom" badge={pendingCount} />
          <NavButton icon="🏡" label="Gerir" active={isActive('manage-accommodations')} 
            onClick={() => handleClick('manage-accommodations')} variant="bottom" />
        </div>
      </nav>
    );
  }

  // Sidebar navigation (desktop & mobile overlay)
  const content = (
    <nav className={variant === 'desktop' ? 'flex-1 p-4 space-y-1' : 'p-4 space-y-1'}>
      <NavSection title="Alojamentos">
        {ACCOMMODATIONS.map((acc, index) => (
          <NavButton
            key={acc.id}
            icon="🏠"
            label={acc.shortName}
            active={isActive('accommodation', index)}
            onClick={() => handleClick('accommodation', index)}
            variant="sidebar"
          />
        ))}
      </NavSection>

      <div className="border-t border-gray-200 my-3" />

      <NavSection title="Geral">
        <NavButton icon="📊" label="Dashboard" active={isActive('insights')} 
          onClick={() => handleClick('insights')} variant="sidebar" />
        <NavButton icon="📋" label="Todas Reservas" active={isActive('all-bookings')} 
          onClick={() => handleClick('all-bookings')} variant="sidebar" badge={pendingCount} />
        <NavButton icon="🏡" label="Gerir Alojamentos" active={isActive('manage-accommodations')} 
          onClick={() => handleClick('manage-accommodations')} variant="sidebar" />
      </NavSection>
    </nav>
  );

  if (variant === 'desktop') {
    return (
      <aside className="hidden lg:flex w-56 bg-white border-r border-gray-200 flex-col">
        {content}
      </aside>
    );
  }

  // Mobile overlay
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white z-40 lg:hidden shadow-xl">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <span className="font-semibold text-dark">Menu</span>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
        </div>
        {content}
      </aside>
    </>
  );
}

// Helper components
function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2">
        {title}
      </div>
      {children}
    </>
  );
}

interface NavButtonProps {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  variant: 'sidebar' | 'bottom';
  badge?: number;
}

function NavButton({ icon, label, active, onClick, variant, badge }: NavButtonProps) {
  if (variant === 'bottom') {
    return (
      <button
        onClick={onClick}
        className={`flex flex-col items-center py-2 px-2 rounded-lg transition-colors relative ${
          active ? 'text-primary' : 'text-gray-500'
        }`}
      >
        <span className="text-lg">{icon}</span>
        <span className="text-[10px] mt-0.5">{label}</span>
        {badge && badge > 0 && (
          <span className="absolute top-1 right-0 px-1 py-0.5 text-[8px] bg-yellow-500 text-white rounded-full min-w-[14px] text-center">
            {badge}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
        active ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <span className="flex items-center gap-3">
        <span>{icon}</span>
        <span className="font-medium text-sm">{label}</span>
      </span>
      {badge && badge > 0 && (
        <span className={`px-2 py-0.5 text-xs rounded-full ${
          active ? 'bg-white/20 text-white' : 'bg-yellow-500 text-white'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}
