import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Calendar, User, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { calculateAutoPriority, getPriorityInfo } from '../../utils/priorityUtils';
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ListView({ projects, onQuickAction }) {
  const [sortConfig, setSortConfig] = useState({ key: 'priority', direction: 'asc' });
  const [filterStatus, setFilterStatus] = useState('all');

  // Get display name from project members
  const getAssignee = (project) => {
    const members = project.project_members || [];
    if (members.length === 0) return null;
    if (members.length === 1) return members[0].profiles?.full_name || 'Usuario';
    return `${members[0].profiles?.full_name || 'Usuario'} +${members.length - 1}`;
  };

  // Format deadline with smart labels
  const formatDeadline = (deadline) => {
    if (!deadline) return { text: 'Sin fecha', class: 'text-text-muted' };
    
    const date = new Date(deadline);
    const days = differenceInDays(date, new Date());
    
    if (isPast(date) && !isToday(date)) {
      return { text: `Vencido (${format(date, 'dd MMM', { locale: es })})`, class: 'text-red-500 font-medium' };
    }
    if (isToday(date)) {
      return { text: 'Hoy', class: 'text-orange-500 font-medium' };
    }
    if (isTomorrow(date)) {
      return { text: 'Mañana', class: 'text-yellow-600 font-medium' };
    }
    if (days <= 7) {
      return { text: format(date, 'EEEE', { locale: es }), class: 'text-blue-500' };
    }
    return { text: format(date, 'dd MMM', { locale: es }), class: 'text-text-secondary' };
  };

  // Status configuration
  const statusConfig = {
    pending: { label: 'Pendiente', color: 'bg-gray-100 text-gray-700', icon: Clock },
    active: { label: 'En Curso', color: 'bg-blue-100 text-blue-700', icon: AlertTriangle },
    completed: { label: 'Completado', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  };

  // Sorting logic
  const sortedProjects = useMemo(() => {
    let filtered = [...projects];
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'priority': {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          aValue = priorityOrder[calculateAutoPriority(a.deadline, a.priority)];
          bValue = priorityOrder[calculateAutoPriority(b.deadline, b.priority)];
          break;
        }
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'deadline':
          aValue = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          bValue = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          break;
        case 'progress':
          aValue = a.progress || 0;
          bValue = b.progress || 0;
          break;
        case 'assignee':
          aValue = getAssignee(a)?.toLowerCase() || 'zzz';
          bValue = getAssignee(b)?.toLowerCase() || 'zzz';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [projects, sortConfig, filterStatus]);

  // Toggle sort
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Sort indicator helper (not a component to avoid render issues)
  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <ChevronUp size={14} className="opacity-0 group-hover:opacity-30" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} className="text-accent-blue" /> 
      : <ChevronDown size={14} className="text-accent-blue" />;
  };

  // Avatar color helper
  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    return colors[name ? name.charCodeAt(0) % colors.length : 0];
  };

  return (
    <div className="h-full flex flex-col bg-surface-card rounded-xl border border-surface-border overflow-hidden">
      {/* Header with filters */}
      <div className="px-4 py-3 border-b border-surface-border bg-surface-secondary flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-text-primary">
          {sortedProjects.length} proyecto{sortedProjects.length !== 1 ? 's' : ''}
        </h2>
        
        {/* Status Filter Pills */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'pending', label: 'Pendientes' },
            { key: 'active', label: 'En Curso' },
            { key: 'completed', label: 'Completados' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filterStatus === key
                  ? 'bg-accent-blue text-white'
                  : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-surface-secondary sticky top-0 z-10">
            <tr className="text-xs text-text-muted uppercase tracking-wider">
              <th 
                className="px-4 py-3 text-left font-semibold cursor-pointer group hover:bg-surface-hover transition-colors w-10"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center gap-1">
                  Prioridad
                  {renderSortIcon("priority")}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-semibold cursor-pointer group hover:bg-surface-hover transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Proyecto
                  {renderSortIcon("name")}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-semibold cursor-pointer group hover:bg-surface-hover transition-colors w-40"
                onClick={() => handleSort('assignee')}
              >
                <div className="flex items-center gap-1">
                  Asignado
                  {renderSortIcon("assignee")}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-semibold cursor-pointer group hover:bg-surface-hover transition-colors w-32"
                onClick={() => handleSort('deadline')}
              >
                <div className="flex items-center gap-1">
                  Fecha Límite
                  {renderSortIcon("deadline")}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-semibold cursor-pointer group hover:bg-surface-hover transition-colors w-32"
                onClick={() => handleSort('progress')}
              >
                <div className="flex items-center gap-1">
                  Progreso
                  {renderSortIcon("progress")}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-semibold w-28">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {sortedProjects.map((project) => {
              const effectivePriority = calculateAutoPriority(project.deadline, project.priority);
              const priorityInfo = getPriorityInfo(effectivePriority);
              const assignee = getAssignee(project);
              const deadline = formatDeadline(project.deadline);
              const status = statusConfig[project.status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <tr 
                  key={project.id}
                  className="hover:bg-surface-hover transition-colors cursor-pointer group"
                  onClick={() => onQuickAction(project.id, 'edit')}
                >
                  {/* Priority */}
                  <td className="px-4 py-3">
                    <div 
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${priorityInfo.bgColor}`}
                      title={priorityInfo.label}
                    >
                      {priorityInfo.icon}
                    </div>
                  </td>

                  {/* Project Name */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-text-primary group-hover:text-accent-blue transition-colors">
                        {project.name}
                      </span>
                      {project.quick_note && (
                        <span className="text-xs text-text-muted truncate max-w-md">
                          {project.quick_note}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Assignee */}
                  <td className="px-4 py-3">
                    {assignee ? (
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full ${getAvatarColor(assignee)} flex items-center justify-center text-white text-xs font-bold`}>
                          {assignee.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-text-secondary truncate">
                          {assignee}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-text-muted italic flex items-center gap-1">
                        <User size={14} />
                        Sin asignar
                      </span>
                    )}
                  </td>

                  {/* Deadline */}
                  <td className="px-4 py-3">
                    <div className={`flex items-center gap-1.5 text-sm ${deadline.class}`}>
                      <Calendar size={14} />
                      {deadline.text}
                    </div>
                  </td>

                  {/* Progress */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-surface-border rounded-full overflow-hidden max-w-20">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            project.progress >= 100 ? 'bg-green-500' :
                            project.progress >= 50 ? 'bg-blue-500' :
                            project.progress > 0 ? 'bg-yellow-500' : 'bg-gray-300'
                          }`}
                          style={{ width: `${project.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-muted font-medium w-8">
                        {project.progress || 0}%
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      <StatusIcon size={12} />
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sortedProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-medium">No hay proyectos para mostrar</p>
            <p className="text-sm">Prueba cambiando los filtros</p>
          </div>
        )}
      </div>
    </div>
  );
}
