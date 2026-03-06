// Reusable header component
import { UserButton } from '@clerk/clerk-react';

interface HeaderProps {
  userName?: string;
  onMenuToggle: () => void;
}

export default function Header({ userName, onMenuToggle }: HeaderProps) {
  return (
    <header className="bg-dark text-white shadow-lg z-20">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <img src="/images/logo.jpeg" alt="Logo" className="h-10 w-10 rounded-full object-cover" />
            <div>
              <h1 className="text-lg font-bold">Method & Passion</h1>
              <p className="text-xs opacity-80">Admin Dashboard</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {userName && <span className="text-sm opacity-80 hidden sm:block">{userName}</span>}
          <UserButton afterSignOutUrl="/admin" />
        </div>
      </div>
    </header>
  );
}
