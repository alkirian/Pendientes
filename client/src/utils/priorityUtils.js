// Calculate automatic priority based on deadline and manual setting
export function calculateAutoPriority(deadline, manualPriority = null) {
  // 1. CRITICAL: If deadline is very close (<= 3 days), FORCE High Priority
  // This overrides manual priority as per user request ("más allá de que el usuario elija")
  // Using 3 days as "very close" threshold
  if (deadline) {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    const daysUntilDeadline = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline <= 3) {
      return 'high';
    }
  }

  // 2. Use Manual Priority if set (and not 'auto')
  if (manualPriority && manualPriority !== 'auto') {
    return manualPriority;
  }

  // 3. Fallback to time-based logic if no manual setting (legacy 'auto' behavior)
  if (!deadline) {
    return 'low';
  }

  const deadlineDate = new Date(deadline);
  const today = new Date(); // Re-instantiate or reuse logic (reuse is cleaner but for safety re-calc)
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0); 
  const daysUntilDeadline = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

  if (daysUntilDeadline <= 7) {
    return 'high';
  } else if (daysUntilDeadline <= 30) {
    return 'medium';
  } else {
    return 'low';
  }
}

// Format deadline for display
export function formatDeadline(deadline) {
  if (!deadline) return null;
  
  // Parse deadline - handle both ISO strings and date-only strings
  // For date-only strings like "2024-12-15", parse as local date (not UTC)
  let deadlineDate;
  if (typeof deadline === 'string' && deadline.length === 10) {
    // Date-only format: YYYY-MM-DD - parse as local
    const [year, month, day] = deadline.split('-').map(Number);
    deadlineDate = new Date(year, month - 1, day);
  } else {
    deadlineDate = new Date(deadline);
  }
  
  // Get today at midnight local time
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get deadline at midnight local time
  deadlineDate.setHours(0, 0, 0, 0);

  // Calculate difference in days
  const diffTime = deadlineDate.getTime() - today.getTime();
  const daysUntilDeadline = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (daysUntilDeadline < 0) {
    return `Vencido hace ${Math.abs(daysUntilDeadline)} día${Math.abs(daysUntilDeadline) !== 1 ? 's' : ''}`;
  } else if (daysUntilDeadline === 0) {
    return 'Vence hoy';
  } else if (daysUntilDeadline === 1) {
    return 'Vence mañana';
  } else if (daysUntilDeadline <= 7) {
    return `Vence en ${daysUntilDeadline} días`;
  } else {
    return deadlineDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

// Get priority display info (icon, label, colors)
export function getPriorityInfo(priority) {
  const config = {
    high: {
      icon: '🔴',
      label: 'Alta',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      borderColor: 'border-red-300'
    },
    medium: {
      icon: '🟡',
      label: 'Media',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-300'
    },
    low: {
      icon: '🟢',
      label: 'Baja',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-300'
    }
  };

  return config[priority] || config.low;
}
