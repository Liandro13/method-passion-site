// Stats cards component
interface StatsCardsProps {
  todayCheckIns: number;
  pendingCount: number;
  monthBookings: number;
  onPendingClick: () => void;
}

export default function StatsCards({ todayCheckIns, pendingCount, monthBookings, onPendingClick }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-6">
      <StatCard value={todayCheckIns} label="Check-ins hoje" color="text-primary" />
      <StatCard 
        value={pendingCount} 
        label="Pendentes" 
        color="text-yellow-500" 
        onClick={onPendingClick}
      />
      <StatCard value={monthBookings} label="Este mês" color="text-green-600" />
    </div>
  );
}

interface StatCardProps {
  value: number;
  label: string;
  color: string;
  onClick?: () => void;
}

function StatCard({ value, label, color, onClick }: StatCardProps) {
  return (
    <div 
      className={`bg-white rounded-xl shadow p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className={`text-2xl lg:text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-xs lg:text-sm text-gray-500">{label}</div>
    </div>
  );
}
