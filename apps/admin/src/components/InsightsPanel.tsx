import { useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import { pt } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { fetchDashboardStats, DashboardStats } from '../lib/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const ACCOMMODATION_COLORS: Record<number, string> = {
  1: '#3b82f6', // Esperança - blue
  2: '#10b981', // Nattura - green
  3: '#f59e0b'  // Douro - amber
};

export default function InsightsPanel() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Period selection - default to current month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const [startDate, setStartDate] = useState<Date>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<Date>(lastDayOfMonth);
  const [selectedAccommodation, setSelectedAccommodation] = useState<number | null>(null);

  // Period presets
  const setPeriod = (preset: 'month' | 'quarter' | 'year' | 'all') => {
    const today = new Date();
    switch (preset) {
      case 'month':
        setStartDate(new Date(today.getFullYear(), today.getMonth(), 1));
        setEndDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        setStartDate(new Date(today.getFullYear(), quarter * 3, 1));
        setEndDate(new Date(today.getFullYear(), quarter * 3 + 3, 0));
        break;
      case 'year':
        setStartDate(new Date(today.getFullYear(), 0, 1));
        setEndDate(new Date(today.getFullYear(), 11, 31));
        break;
      case 'all':
        setStartDate(new Date(2020, 0, 1));
        setEndDate(today);
        break;
    }
  };

  // Load stats
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        const data = await fetchDashboardStats(startStr, endStr);
        setStats(data);
      } catch (err) {
        setError('Erro ao carregar estatísticas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [startDate, endDate]);

  // Get display stats based on filter
  const displayStats = useMemo(() => {
    if (!stats) return null;
    if (selectedAccommodation === null) {
      return stats.global;
    }
    return stats.perAccommodation.find(a => a.id === selectedAccommodation) || stats.global;
  }, [stats, selectedAccommodation]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Prepare chart data
  const revenueByAccommodation = useMemo(() => {
    if (!stats) return [];
    return stats.perAccommodation.map(acc => ({
      name: acc.name.split(' ')[0], // Short name
      fullName: acc.name,
      revenue: acc.totalRevenue,
      netRevenue: acc.netRevenue,
      bookings: acc.confirmedCount,
      occupancy: acc.occupancyRate
    }));
  }, [stats]);

  const platformData = useMemo(() => {
    if (!displayStats) return [];
    const breakdown = displayStats.platformBreakdown;
    return Object.entries(breakdown).map(([platform, data]) => ({
      name: platform || 'Direto',
      value: data.count,
      revenue: data.revenue
    }));
  }, [displayStats]);

  const nationalityData = useMemo(() => {
    if (!displayStats) return [];
    return displayStats.nationalityBreakdown;
  }, [displayStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (!stats || !displayStats) return null;

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-col gap-4">
          {/* Period Selection */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Período:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPeriod('month')}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Mês
              </button>
              <button
                onClick={() => setPeriod('quarter')}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Trimestre
              </button>
              <button
                onClick={() => setPeriod('year')}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Ano
              </button>
              <button
                onClick={() => setPeriod('all')}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Tudo
              </button>
            </div>
          </div>

          {/* Date Pickers */}
          <div className="flex flex-wrap items-center gap-2">
            <DatePicker
              selected={startDate}
              onChange={(date) => date && setStartDate(date)}
              dateFormat="dd/MM/yyyy"
              locale={pt}
              className="px-3 py-2 border rounded-lg text-sm w-32"
            />
            <span className="text-gray-400">até</span>
            <DatePicker
              selected={endDate}
              onChange={(date) => date && setEndDate(date)}
              dateFormat="dd/MM/yyyy"
              locale={pt}
              className="px-3 py-2 border rounded-lg text-sm w-32"
            />
          </div>

          {/* Accommodation Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Filtrar:</span>
            <button
              onClick={() => setSelectedAccommodation(null)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                selectedAccommodation === null 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Global
            </button>
            {stats.perAccommodation.map(acc => (
              <button
                key={acc.id}
                onClick={() => setSelectedAccommodation(acc.id)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedAccommodation === acc.id 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {acc.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPICard
          title="Receita Total"
          value={formatCurrency(displayStats.totalRevenue)}
          color="text-green-600"
          icon="💰"
        />
        <KPICard
          title="Receita Líquida"
          value={formatCurrency(displayStats.netRevenue)}
          subtitle={`-${formatCurrency(displayStats.totalCommissions)} comissões`}
          color="text-blue-600"
          icon="📊"
        />
        <KPICard
          title="Reservas"
          value={displayStats.confirmedCount.toString()}
          subtitle={displayStats.pendingCount > 0 ? `+${displayStats.pendingCount} pendentes` : undefined}
          color="text-primary"
          icon="📅"
        />
        <KPICard
          title="Noites Reservadas"
          value={displayStats.totalNights.toString()}
          subtitle={`~${displayStats.avgStayDuration.toFixed(1)} noites/reserva`}
          color="text-purple-600"
          icon="🌙"
        />
        <KPICard
          title="Taxa Ocupação"
          value={`${displayStats.occupancyRate.toFixed(0)}%`}
          color="text-amber-600"
          icon="📈"
        />
        <KPICard
          title="Hóspedes"
          value={displayStats.totalGuests.toString()}
          subtitle={`~${displayStats.avgGuestsPerBooking.toFixed(1)}/reserva`}
          color="text-teal-600"
          icon="👥"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by Accommodation */}
        {selectedAccommodation === null && (
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-4">Receita por Alojamento</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByAccommodation} layout="vertical">
                  <XAxis type="number" tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => revenueByAccommodation.find(a => a.name === label)?.fullName || label}
                  />
                  <Bar dataKey="revenue" name="Receita Bruta" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="netRevenue" name="Receita Líquida" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Occupancy Comparison */}
        {selectedAccommodation === null && (
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-4">Ocupação por Alojamento</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByAccommodation}>
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  <Bar dataKey="occupancy" name="Taxa de Ocupação" radius={[4, 4, 0, 0]}>
                    {revenueByAccommodation.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={ACCOMMODATION_COLORS[stats.perAccommodation[index]?.id] || COLORS[index]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Platform Distribution */}
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-4">Reservas por Plataforma</h3>
          {platformData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {platformData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string, entry: any) => [
                    `${value} reservas (${formatCurrency(entry.payload.revenue)})`,
                    name
                  ]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Sem dados de plataformas
            </div>
          )}
        </div>

        {/* Top Nationalities */}
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-4">Top 5 Nacionalidades</h3>
          {nationalityData.length > 0 ? (
            <div className="space-y-3">
              {nationalityData.map((item, index) => {
                const maxCount = Math.max(...nationalityData.map(n => n.count));
                const percentage = (item.count / maxCount) * 100;
                return (
                  <div key={item.nationality} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.nationality}</span>
                      <span className="font-medium">{item.count} reservas</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              Sem dados de nacionalidades
            </div>
          )}
        </div>
      </div>

      {/* Per Accommodation Cards (when global is selected) */}
      {selectedAccommodation === null && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.perAccommodation.map(acc => (
            <div
              key={acc.id}
              className="bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-lg transition-shadow border-l-4"
              style={{ borderLeftColor: ACCOMMODATION_COLORS[acc.id] }}
              onClick={() => setSelectedAccommodation(acc.id)}
            >
              <h3 className="font-semibold text-gray-800 mb-3">{acc.name}</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Receita</span>
                  <p className="font-semibold text-green-600">{formatCurrency(acc.totalRevenue)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Ocupação</span>
                  <p className="font-semibold text-amber-600">{acc.occupancyRate.toFixed(0)}%</p>
                </div>
                <div>
                  <span className="text-gray-500">Reservas</span>
                  <p className="font-semibold text-primary">{acc.confirmedCount}</p>
                </div>
                <div>
                  <span className="text-gray-500">Noites</span>
                  <p className="font-semibold text-purple-600">{acc.totalNights}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// KPI Card Component
function KPICard({ 
  title, 
  value, 
  subtitle, 
  color = 'text-gray-800',
  icon 
}: { 
  title: string; 
  value: string; 
  subtitle?: string;
  color?: string;
  icon?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
          <p className={`text-xl lg:text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && <span className="text-2xl opacity-50">{icon}</span>}
      </div>
    </div>
  );
}
