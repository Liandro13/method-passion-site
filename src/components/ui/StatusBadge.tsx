// Reusable status badge component

import { STATUS_COLORS, STATUS_LABELS } from '../../constants';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const label = STATUS_LABELS[status] || status;
  
  return (
    <span className={`px-2 py-1 text-xs rounded-full ${colors.badgeClass} ${className}`}>
      {label}
    </span>
  );
}
