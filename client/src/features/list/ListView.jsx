import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, User } from 'lucide-react';
import { calculateAutoPriority } from '../../utils/priorityUtils';
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDroppable } from '@dnd-kit/core';

// ========== COMPONENTES EXTERNOS (fuera del render) ==========

// Droppable Row Component for user assignment
function DroppableRow({ project, children, isUserDragging }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `list-project-${project.id}`,
    data: { type: 'project-drop', projectId: project.id }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`transition-all duration-200 ${
        isOver 
          ? 'ring-2 ring-accent-blue bg-accent-blue/10' 
          : isUserDragging 
            ? 'ring-1 ring-dashed ring-surface-border' 
            : ''
      }`}
    >
      {children}
    </div>
  );
}

// Priority indicator component - matching mockup style
function PriorityIndicator({ priority }) {
  const config = {
    high: { bg: 'bg-red-500', glow: 'shadow-red-500/50' },
    medium: { bg: 'bg-amber-400', glow: 'shadow-amber-400/50' },
    low: { bg: 'bg-emerald-500', glow: 'shadow-emerald-500/50' }
  };
  const { bg, glow } = config[priority] || config.low;
  
  return (
    <div className={`w-3 h-3 rounded-full ${bg} shadow-lg ${glow} transition-transform duration-300 group-hover:scale-125`} />
  );
}

// Single Avatar component
function Avatar({ name, url, size = 'md', className = '' }) {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-cyan-500'];
  const color = colors[name ? name.charCodeAt(0) % colors.length : 0];
  const sizeClass = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs';
  
  if (url) {
    return (
      <img 
        src={url} 
        alt={name} 
        className={`${sizeClass} rounded-full object-cover ring-2 ring-[#1e1e2e] transition-all duration-300 ${className}`}
        title={name}
      />
    );
  }
  return (
    <div 
      className={`${sizeClass} ${color} rounded-full flex items-center justify-center text-white font-bold ring-2 ring-[#1e1e2e] transition-all duration-300 ${className}`}
      title={name}
    >
      {name ? name.charAt(0).toUpperCase() : '?'}
    </div>
  );
}

// Stacked Avatars component - shows up to 3 avatars overlapped
function AvatarStack({ members }) {
  if (!members || members.length === 0) {
    return (
      <span className="text-sm text-gray-600 flex items-center gap-1.5">
        <User size={14} className="opacity-50" />
        <span>—</span>
      </span>
    );
  }

  const displayMembers = members.slice(0, 3);
  const extraCount = members.length - 3;

  return (
    <div className="flex items-center">
      {/* Stacked avatars */}
      <div className="flex -space-x-2">
        {displayMembers.map((member, index) => (
          <Avatar 
            key={index}
            name={member.name} 
            url={member.avatar}
            size="sm"
            className="relative transition-transform duration-300 group-hover:translate-x-0.5 hover:!scale-110 hover:z-10"
          />
        ))}
        {extraCount > 0 && (
          <div 
            className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-gray-300 font-medium ring-2 ring-[#1e1e2e]"
            title={`+${extraCount} más`}
          >
            +{extraCount}
          </div>
        )}
      </div>
      {/* First name */}
      <span className="ml-2 text-sm text-gray-400 truncate transition-colors duration-300 group-hover:text-gray-300 max-w-[70px]">
        {members[0].name.split(' ')[0]}
      </span>
    </div>
  );
}

// ========== COMPONENTE PRINCIPAL ==========

export default function ListView({ projects, onQuickAction, isUserDragging, onOpenModal }) {
  const [sortConfig, setSortConfig] = useState({ key: 'priority', direction: 'asc' });
  const [filterStatus, setFilterStatus] = useState('all');

  // Get all members for display
  const getMembers = (project) => {
    const members = project.project_members || [];
    return members.map(m => ({
      name: m.profiles?.full_name || 'Usuario',
      avatar: m.profiles?.avatar_url || null
    }));
  };

  // Format deadline with smart labels
  const formatDeadline = (deadline) => {
    if (!deadline) return { text: '—', class: 'text-text-muted', urgent: false };
    
    const date = new Date(deadline);
    
    if (isPast(date) && !isToday(date)) {
      return { text: 'Vencido', class: 'text-red-500 font-semibold', urgent: true };
    }
    if (isToday(date)) {
      return { text: 'Hoy', class: 'text-orange-500 font-semibold', urgent: true };
    }
    if (isTomorrow(date)) {
      return { text: 'Mañana', class: 'text-yellow-500 font-medium', urgent: false };
    }
    if (differenceInDays(date, new Date()) <= 7) {
      return { text: format(date, 'EEE', { locale: es }), class: 'text-blue-400', urgent: false };
    }
    return { text: format(date, 'd MMM', { locale: es }), class: 'text-text-secondary', urgent: false };
  };

  // Sorting logic
  const sortedProjects = useMemo(() => {
    let filtered = [...projects];
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

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
        case 'client':
          aValue = a.client?.toLowerCase() || 'zzz';
          bValue = b.client?.toLowerCase() || 'zzz';
          break;
        case 'deadline':
          aValue = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          bValue = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          break;
        case 'assignee': {
          const aMembers = getMembers(a);
          const bMembers = getMembers(b);
          aValue = aMembers.length > 0 ? aMembers[0].name.toLowerCase() : 'zzz';
          bValue = bMembers.length > 0 ? bMembers[0].name.toLowerCase() : 'zzz';
          break;
        }
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

  // Sort indicator - inline render function (not a component)
  const renderSortIndicator = (columnKey) => {
    const isActive = sortConfig.key === columnKey;
    return (
      <span className={`ml-1.5 transition-all duration-200 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
        {isActive && sortConfig.direction === 'desc' 
          ? <ChevronDown size={14} className="inline text-accent-blue" />
          : <ChevronUp size={14} className={`inline ${isActive ? 'text-accent-blue' : 'text-text-muted'}`} />
        }
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col rounded-2xl overflow-hidden" style={{
      background: 'linear-gradient(180deg, rgba(30,30,46,0.95) 0%, rgba(24,24,37,0.98) 100%)',
      border: '1px solid rgba(255,255,255,0.08)'
    }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{
        background: 'linear-gradient(90deg, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.1) 50%, rgba(236,72,153,0.08) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <span className="text-lg">📋</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Proyectos</h2>
            <p className="text-xs text-gray-400">{sortedProjects.length} activos</p>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'pending', label: 'Pendientes' },
            { key: 'active', label: 'En Curso' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                filterStatus === key
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Column Headers */}
      <div className="px-5 py-3 flex items-center text-xs text-gray-500 font-semibold uppercase tracking-wider" style={{
        background: 'rgba(0,0,0,0.2)',
        borderBottom: '1px solid rgba(255,255,255,0.04)'
      }}>
        <div 
          className="w-10 flex-shrink-0 cursor-pointer group flex items-center justify-center"
          onClick={() => handleSort('priority')}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-gray-600 group-hover:bg-gray-400 transition-colors" />
          {renderSortIndicator('priority')}
        </div>
        
        <div 
          className="flex-1 min-w-0 cursor-pointer group flex items-center hover:text-gray-300 transition-colors"
          onClick={() => handleSort('name')}
        >
          Proyecto
          {renderSortIndicator('name')}
        </div>
        
        <div 
          className="w-36 flex-shrink-0 cursor-pointer group flex items-center hover:text-gray-300 transition-colors"
          onClick={() => handleSort('client')}
        >
          Cliente
          {renderSortIndicator('client')}
        </div>
        
        <div 
          className="w-40 flex-shrink-0 cursor-pointer group flex items-center hover:text-gray-300 transition-colors"
          onClick={() => handleSort('assignee')}
        >
          Responsable
          {renderSortIndicator('assignee')}
        </div>
        
        <div 
          className="w-24 flex-shrink-0 text-right cursor-pointer group flex items-center justify-end hover:text-gray-300 transition-colors"
          onClick={() => handleSort('deadline')}
        >
          Entrega
          {renderSortIndicator('deadline')}
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {sortedProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <div className="text-5xl mb-4 opacity-50">📋</div>
            <p className="font-medium text-gray-400">No hay proyectos</p>
            <p className="text-sm mt-1 text-gray-600">Prueba cambiando los filtros</p>
          </div>
        ) : (
          <div>
            {sortedProjects.map((project) => {
              const effectivePriority = calculateAutoPriority(project.deadline, project.priority);
              const members = getMembers(project);
              const deadline = formatDeadline(project.deadline);

              return (
                <DroppableRow 
                  key={project.id} 
                  project={project}
                  isUserDragging={isUserDragging}
                >
                  <div
                    className="group px-5 py-3 flex items-center cursor-pointer transition-all duration-300 ease-out hover:scale-[1.01] hover:bg-white/[0.04]"
                    onClick={() => onOpenModal && onOpenModal(project)}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      transform: 'translateZ(0)',
                    }}
                  >
                    {/* Priority Indicator */}
                    <div className="w-10 flex-shrink-0 flex items-center justify-center">
                      <PriorityIndicator priority={effectivePriority} />
                    </div>

                    {/* Project Name */}
                    <div className="flex-1 min-w-0 pr-4">
                      <span className="font-medium text-sm text-gray-200 truncate block transition-all duration-300 group-hover:text-white group-hover:translate-x-1">
                        {project.name}
                      </span>
                      {project.quick_note && (
                        <span className="text-xs text-gray-500 truncate block mt-0.5 transition-colors duration-300 group-hover:text-gray-400">
                          📝 {project.quick_note}
                        </span>
                      )}
                    </div>

                    {/* Client */}
                    <div className="w-36 flex-shrink-0 pr-3">
                      <span className="text-sm text-gray-400 truncate block transition-colors duration-300 group-hover:text-gray-300">
                        {project.client || '—'}
                      </span>
                    </div>

                    {/* Assignee - Stacked Avatars */}
                    <div className="w-40 flex-shrink-0">
                      <AvatarStack members={members} />
                    </div>

                    {/* Deadline */}
                    <div className="w-24 flex-shrink-0 text-right">
                      <span className={`text-sm font-medium transition-all duration-300 ${deadline.class} ${deadline.urgent ? 'group-hover:scale-105 inline-block' : ''}`}>
                        {deadline.text}
                      </span>
                    </div>
                  </div>
                </DroppableRow>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {sortedProjects.length > 0 && (
        <div className="px-5 py-2.5 flex items-center justify-between text-xs text-gray-500" style={{
          background: 'rgba(0,0,0,0.3)',
          borderTop: '1px solid rgba(255,255,255,0.04)'
        }}>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              {sortedProjects.filter(p => calculateAutoPriority(p.deadline, p.priority) === 'high').length} urgentes
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              {sortedProjects.filter(p => calculateAutoPriority(p.deadline, p.priority) === 'medium').length} en progreso
            </span>
          </div>
          <span className="text-gray-600">
            Click en columna para ordenar
          </span>
        </div>
      )}
    </div>
  );
}
