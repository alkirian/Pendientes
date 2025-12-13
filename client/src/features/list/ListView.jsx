import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Calendar, User, AlertTriangle, Building2, StickyNote, ExternalLink, Check, X } from 'lucide-react';
import { calculateAutoPriority, getPriorityInfo } from '../../utils/priorityUtils';
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// Inline Editable Cell Component
function EditableCell({ value, onSave, type = 'text', placeholder = '', className = '' }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  const handleSave = async () => {
    if (editValue !== value) {
      await onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && type !== 'textarea') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {type === 'textarea' ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') handleCancel(); }}
            autoFocus
            rows={2}
            className={`w-full bg-surface-secondary border border-accent-blue rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue resize-none ${className}`}
            placeholder={placeholder}
          />
        ) : (
          <input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className={`bg-surface-secondary border border-accent-blue rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue ${className}`}
          />
        )}
        <button onClick={handleSave} className="p-1 text-green-500 hover:bg-green-100 rounded">
          <Check size={14} />
        </button>
        <button onClick={handleCancel} className="p-1 text-red-400 hover:bg-red-100 rounded">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
      className={`cursor-pointer hover:bg-surface-hover px-2 py-1 rounded transition-colors ${className}`}
      title="Click para editar"
    >
      {value || <span className="text-text-muted italic text-sm">{placeholder}</span>}
    </div>
  );
}

export default function ListView({ projects, onQuickAction }) {
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState({ key: 'priority', direction: 'asc' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [localProjects, setLocalProjects] = useState(null);

  // Use local state if available, otherwise props
  const projectList = localProjects || projects;

  // Update project field in database
  const updateProject = async (projectId, field, value) => {
    const { error } = await supabase
      .from('projects')
      .update({ [field]: value })
      .eq('id', projectId);
    
    if (!error) {
      // Update local state  
      setLocalProjects(prev => {
        const list = prev || projects;
        return list.map(p => p.id === projectId ? { ...p, [field]: value } : p);
      });
    }
  };

  // Get display name from project members
  const getAssignee = (project) => {
    const members = project.project_members || [];
    if (members.length === 0) return null;
    if (members.length === 1) return members[0].profiles?.full_name || 'Usuario';
    return `${members[0].profiles?.full_name || 'Usuario'} +${members.length - 1}`;
  };

  // Get avatar URL from first member
  const getAssigneeAvatar = (project) => {
    const members = project.project_members || [];
    if (members.length === 0) return null;
    return members[0].profiles?.avatar_url || null;
  };

  // Format deadline with smart labels
  const formatDeadline = (deadline) => {
    if (!deadline) return { text: 'Sin fecha', class: 'text-text-muted', urgent: false };
    
    const date = new Date(deadline);
    const days = differenceInDays(date, new Date());
    
    if (isPast(date) && !isToday(date)) {
      return { text: `Vencido`, class: 'text-red-500 font-semibold', urgent: true };
    }
    if (isToday(date)) {
      return { text: 'Hoy', class: 'text-orange-500 font-semibold', urgent: true };
    }
    if (isTomorrow(date)) {
      return { text: 'Mañana', class: 'text-yellow-500 font-medium', urgent: false };
    }
    if (days <= 7) {
      return { text: format(date, 'EEEE', { locale: es }), class: 'text-blue-400', urgent: false };
    }
    return { text: format(date, 'dd MMM', { locale: es }), class: 'text-text-secondary', urgent: false };
  };

  // Sorting logic
  const sortedProjects = useMemo(() => {
    let filtered = [...projectList];
    
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
        case 'client':
          aValue = a.client?.toLowerCase() || 'zzz';
          bValue = b.client?.toLowerCase() || 'zzz';
          break;
        case 'deadline':
          aValue = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          bValue = b.deadline ? new Date(b.deadline).getTime() : Infinity;
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
  }, [projectList, sortConfig, filterStatus]);

  // Toggle sort
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Sort indicator helper
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

  // Priority colors for row accent
  const priorityRowColors = {
    high: 'border-l-4 border-l-red-500',
    medium: 'border-l-4 border-l-orange-400',
    low: 'border-l-4 border-l-emerald-500'
  };

  return (
    <div className="h-full flex flex-col bg-surface-card rounded-xl border border-surface-border overflow-hidden shadow-lg">
      {/* Header with filters */}
      <div className="px-5 py-4 border-b border-surface-border bg-gradient-to-r from-surface-secondary to-surface-card flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-text-primary">
            📋 Proyectos
          </h2>
          <span className="bg-accent-blue/20 text-accent-blue px-2.5 py-0.5 rounded-full text-sm font-semibold">
            {sortedProjects.length}
          </span>
        </div>
        
        {/* Status Filter Pills */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Todos', icon: '📁' },
            { key: 'pending', label: 'Pendientes', icon: '⏳' },
            { key: 'active', label: 'En Curso', icon: '🔄' },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                filterStatus === key
                  ? 'bg-accent-blue text-white shadow-md'
                  : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[1100px]">
          <thead className="bg-surface-secondary/80 backdrop-blur sticky top-0 z-10">
            <tr className="text-xs text-text-muted uppercase tracking-wider">
              <th 
                className="px-4 py-3 text-left font-semibold cursor-pointer group hover:bg-surface-hover transition-colors w-20"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center gap-1">
                  Prioridad
                  {renderSortIcon("priority")}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-semibold cursor-pointer group hover:bg-surface-hover transition-colors w-56"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Proyecto
                  {renderSortIcon("name")}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-semibold w-64">
                <div className="flex items-center gap-1">
                  <StickyNote size={14} className="text-yellow-500" />
                  Notas
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-semibold cursor-pointer group hover:bg-surface-hover transition-colors w-36"
                onClick={() => handleSort('client')}
              >
                <div className="flex items-center gap-1">
                  Cliente
                  {renderSortIcon("client")}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-semibold cursor-pointer group hover:bg-surface-hover transition-colors w-40"
                onClick={() => handleSort('assignee')}
              >
                <div className="flex items-center gap-1">
                  Responsable
                  {renderSortIcon("assignee")}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-semibold cursor-pointer group hover:bg-surface-hover transition-colors w-32"
                onClick={() => handleSort('deadline')}
              >
                <div className="flex items-center gap-1">
                  Entrega
                  {renderSortIcon("deadline")}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-semibold w-12">
                
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border/50">
            {sortedProjects.map((project) => {
              const effectivePriority = calculateAutoPriority(project.deadline, project.priority);
              const priorityInfo = getPriorityInfo(effectivePriority);
              const assignee = getAssignee(project);
              const assigneeAvatar = getAssigneeAvatar(project);
              const deadline = formatDeadline(project.deadline);

              return (
                <tr 
                  key={project.id}
                  className={`hover:bg-surface-hover/50 transition-all cursor-pointer group ${priorityRowColors[effectivePriority]}`}
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  {/* Priority */}
                  <td className="px-4 py-3">
                    <div 
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm ${priorityInfo.bgColor}`}
                      title={priorityInfo.label}
                    >
                      {priorityInfo.icon}
                    </div>
                  </td>

                  {/* Project Name */}
                  <td className="px-4 py-3">
                    <span className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors text-base">
                      {project.name}
                    </span>
                  </td>

                  {/* Notes - Editable, Bold, Larger */}
                  <td className="px-4 py-3">
                    <EditableCell
                      value={project.quick_note}
                      onSave={(val) => updateProject(project.id, 'quick_note', val)}
                      type="textarea"
                      placeholder="📝 Agregar nota..."
                      className="font-bold text-sm text-text-primary min-w-[180px]"
                    />
                  </td>

                  {/* Client */}
                  <td className="px-4 py-3">
                    {project.client ? (
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-text-muted" />
                        <span className="text-sm text-text-secondary font-medium">
                          {project.client}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted italic">
                        Sin cliente
                      </span>
                    )}
                  </td>

                  {/* Assignee */}
                  <td className="px-4 py-3">
                    {assignee ? (
                      <div className="flex items-center gap-2">
                        {assigneeAvatar ? (
                          <img 
                            src={assigneeAvatar} 
                            alt={assignee}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-7 h-7 rounded-full ${getAvatarColor(assignee)} flex items-center justify-center text-white text-xs font-bold`}>
                            {assignee.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm text-text-secondary truncate">
                          {assignee}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted italic flex items-center gap-1">
                        <User size={12} />
                        Sin asignar
                      </span>
                    )}
                  </td>

                  {/* Deadline - Editable */}
                  <td className="px-4 py-3">
                    <div onClick={(e) => e.stopPropagation()}>
                      <EditableCell
                        value={project.deadline?.split('T')[0] || ''}
                        onSave={(val) => updateProject(project.id, 'deadline', val)}
                        type="date"
                        placeholder="Sin fecha"
                        className={`text-sm ${deadline.class}`}
                      />
                      {!project.deadline && (
                        <span className="text-xs text-text-muted">Sin fecha</span>
                      )}
                      {project.deadline && deadline.urgent && (
                        <div className="flex items-center gap-1 text-xs mt-0.5">
                          <AlertTriangle size={12} className="text-red-500" />
                          <span className={deadline.class}>{deadline.text}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/${project.id}`);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-accent-blue hover:text-accent-blue/80 p-1"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sortedProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <div className="text-5xl mb-4">📋</div>
            <p className="font-semibold text-lg">No hay proyectos para mostrar</p>
            <p className="text-sm mt-1">Prueba cambiando los filtros</p>
          </div>
        )}
      </div>
    </div>
  );
}
