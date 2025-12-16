import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit3, Trash2, UserPlus, Calendar, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import { calculateAutoPriority, formatDeadline } from '../../utils/priorityUtils';

export default function ProjectCard({ project, onQuickAction, isUserDragging, isProjectDragging = false, disableDrag = false, uniqueId, onOpenModal }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showPriorityOptions, setShowPriorityOptions] = useState(false);
  const menuRef = useRef(null);

  // Use uniqueId if provided, otherwise fall back to project.id
  const dragId = uniqueId || project.id;

  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { type: 'project', project, uniqueId: dragId },
    disabled: disableDrag
  });

  // Make project card a drop target for users - DISABLED when dragging a project
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `project-${project.id}`,
    data: { type: 'project-drop', projectId: project.id },
    disabled: isProjectDragging
  });

  // Combine refs
  const setNodeRef = (node) => {
    setDragRef(node);
    setDropRef(node);
  };

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
  } : undefined;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setShowPriorityOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate effective priority (auto or manual)
  const effectivePriority = calculateAutoPriority(project.deadline, project.priority);

  // NEW MINIMALIST DESIGN - Border accent only, no background colors
  const priorityConfig = {
    low: { 
      label: 'Baja', 
      borderColor: 'border-l-emerald-400',
      badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      icon: '🟢'
    },
    medium: { 
      label: 'Media', 
      borderColor: 'border-l-amber-400',
      badgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      icon: '🟡'
    },
    high: { 
      label: 'Alta', 
      borderColor: 'border-l-red-400',
      badgeBg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      icon: '🔴'
    },
  };

  const handleMenuClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAction = (action, value) => {
    if (action === 'toggle_priority') {
      setShowPriorityOptions(!showPriorityOptions);
      return;
    }
    
    setShowMenu(false);
    setShowPriorityOptions(false);
    if (onQuickAction) {
      onQuickAction(project.id, action, value);
    }
  };

  // Quick Note State
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState(project.quick_note || '');

  useEffect(() => {
    setNoteContent(project.quick_note || '');
  }, [project.quick_note]);

  const handleNoteSave = () => {
    setIsEditingNote(false);
    if (noteContent !== project.quick_note) {
      if (onQuickAction) {
        onQuickAction(project.id, 'update_note', noteContent);
      }
    }
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    return colors[name ? name.charCodeAt(0) % colors.length : 0];
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  const handleCardClick = (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('textarea')) {
      return;
    }
    if (showMenu) {
      return;
    }
    if (onOpenModal) {
      onOpenModal(project);
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      onClick={handleCardClick}
      className={`
        group relative rounded-lg cursor-pointer
        bg-surface-card border border-surface-border
        border-l-4 ${priorityConfig[effectivePriority]?.borderColor}
        ${isDragging ? 'opacity-20 grayscale border-dashed' : ''}
        ${isOver && isUserDragging ? 'ring-2 ring-green-400 scale-[1.01]' : ''}
        hover:border-surface-hover
        transition-all duration-150 mb-3
      `}
    >
      {/* Drag Handle */}
      {!disableDrag && (
        <div 
          {...listeners} 
          {...attributes}
          className="absolute inset-0 z-0"
        />
      )}

      {/* Content */}
      <div className="relative z-10 p-4 pointer-events-none">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-text-primary line-clamp-2 leading-tight">
              {project.name}
            </h3>
            <p className="text-sm text-text-secondary mt-0.5">
              {project.client || 'Sin cliente'}
            </p>
          </div>

          {/* Menu Button - Always visible on mobile, hover on desktop */}
          <div ref={menuRef} className="pointer-events-auto ml-2">
            <button 
              onClick={handleMenuClick}
              className="p-2 lg:p-1.5 rounded-lg hover:bg-surface-hover lg:opacity-0 lg:group-hover:opacity-100 transition-opacity text-text-muted hover:text-text-primary touch-target"
            >
              <MoreVertical size={20} className="lg:hidden" />
              <MoreVertical size={16} className="hidden lg:block" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-surface-card rounded-lg border border-surface-border py-1 z-50 animate-fade-in">
                <button 
                  onClick={() => { setShowMenu(false); if (onOpenModal) onOpenModal(project); }}
                  className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-surface-hover flex items-center gap-3"
                >
                  <ExternalLink size={14} /> Ver detalles
                </button>
                
                <button 
                  onClick={() => handleAction('edit')}
                  className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-surface-hover flex items-center gap-3"
                >
                  <Edit3 size={14} /> Editar
                </button>
                
                <button 
                  onClick={() => handleAction('assign')}
                  className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-surface-hover flex items-center gap-3"
                >
                  <UserPlus size={14} /> Asignar equipo
                </button>

                <div className="border-t border-surface-border my-1"></div>

                <div className="px-4 py-2 text-sm text-text-secondary">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAction('toggle_priority'); }}
                    className="w-full text-left flex items-center justify-between hover:bg-surface-hover p-1 -ml-1 rounded"
                  >
                    <span className="flex items-center gap-2"><Clock size={14} /> Prioridad</span>
                    <span className="text-xs">▾</span>
                  </button>
                  
                  {showPriorityOptions && (
                    <div className="pl-6 mt-1 space-y-1 animate-fade-in">
                      <button onClick={() => handleAction('update_priority', 'low')} className="block w-full text-left px-2 py-1 text-xs hover:bg-emerald-500/10 text-emerald-500 rounded">
                        🟢 Baja
                      </button>
                      <button onClick={() => handleAction('update_priority', 'medium')} className="block w-full text-left px-2 py-1 text-xs hover:bg-amber-500/10 text-amber-500 rounded">
                        🟡 Media
                      </button>
                      <button onClick={() => handleAction('update_priority', 'high')} className="block w-full text-left px-2 py-1 text-xs hover:bg-red-500/10 text-red-500 rounded">
                        🔴 Alta
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-surface-border my-1"></div>
                
                <button 
                  onClick={() => handleAction('complete')}
                  className="w-full px-4 py-2 text-left text-sm text-emerald-500 hover:bg-emerald-500/10 flex items-center gap-3"
                >
                  <CheckCircle size={14} /> Completar
                </button>
                
                <button 
                  onClick={() => handleAction('delete')}
                  className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-3"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Priority & Deadline Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${priorityConfig[effectivePriority]?.badgeBg}`}>
            {priorityConfig[effectivePriority]?.icon} {priorityConfig[effectivePriority]?.label}
          </span>
          {project.deadline && (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-surface-secondary text-text-secondary flex items-center gap-1">
              <Clock size={10} /> {formatDeadline(project.deadline)}
            </span>
          )}
        </div>

        {/* Quick Note */}
        <div className="mb-3 pointer-events-auto">
          {isEditingNote ? (
            <textarea
              autoFocus
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              onBlur={handleNoteSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleNoteSave();
                }
              }}
              className="w-full text-sm p-3 border rounded-lg focus:ring-2 outline-none resize-none bg-surface-secondary text-text-primary border-surface-border focus:ring-accent-blue focus:border-accent-blue"
              rows={2}
              placeholder="Escribe una nota rápida..."
            />
          ) : (
            <div 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsEditingNote(true);
              }}
              className="cursor-pointer p-3 rounded-lg transition-colors bg-surface-secondary hover:bg-surface-hover border border-transparent hover:border-surface-border"
            >
              <p className="text-sm text-text-primary line-clamp-2">
                {project.quick_note || <span className="text-text-muted italic">📝 Agregar nota...</span>}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-border">
          <div className="flex items-center gap-3">
            {/* Project Members */}
            {project.project_members && project.project_members.length > 0 && (
              <div className="flex -space-x-2">
                {project.project_members.slice(0, 3).map((member, idx) => (
                  member.profiles?.avatar_url ? (
                    <img 
                      key={member.user_id || idx}
                      src={member.profiles.avatar_url}
                      alt={member.profiles?.full_name || 'Miembro'}
                      title={member.profiles?.full_name || 'Miembro del equipo'}
                      className="w-6 h-6 rounded-full object-cover border-2 border-surface-card"
                    />
                  ) : (
                    <div 
                      key={member.user_id || idx}
                      className={`w-6 h-6 rounded-full ${getAvatarColor(member.profiles?.full_name)} border-2 border-surface-card flex items-center justify-center text-white text-[10px] font-bold`}
                      title={member.profiles?.full_name || 'Miembro del equipo'}
                    >
                      {getInitial(member.profiles?.full_name)}
                    </div>
                  )
                ))}
                {project.project_members.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-surface-elevated border-2 border-surface-card flex items-center justify-center text-text-muted text-[10px] font-medium">
                    +{project.project_members.length - 3}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-1 text-xs text-text-muted">
              <Calendar size={11} />
              <span>{new Date(project.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          
          {/* View Details Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); if (onOpenModal) onOpenModal(project); }}
            className="text-xs font-medium pointer-events-auto flex items-center gap-1 text-accent-blue hover:text-blue-500"
          >
            Ver detalles <ExternalLink size={10} />
          </button>
        </div>
      </div>

      {/* User Drop Indicator */}
      {isOver && isUserDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 rounded-lg pointer-events-none border-2 border-green-400 border-dashed">
          <span className="text-green-500 text-sm font-medium px-3 py-1 bg-surface-card rounded-full">
            Soltar para asignar
          </span>
        </div>
      )}
    </div>
  );
}
