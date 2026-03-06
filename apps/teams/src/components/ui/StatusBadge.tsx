interface StatusBadgeProps {
  status: 'confirmed' | 'pending' | 'cancelled';
}

const statusConfig = {
  confirmed: { label: 'Confirmado', className: 'bg-green-100 text-green-800' },
  pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
  cancelled: { label: 'Cancelado', className: 'bg-gray-100 text-gray-600' }
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
