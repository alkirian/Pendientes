import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, MoreVertical, Edit3, Trash2, UserPlus, Calendar, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import { calculateAutoPriority, formatDeadline } from '../../utils/priorityUtils';

export default function ProjectCard({ project, onQuickAction, isUserDragging, disableDrag = false, uniqueId }) {
  const navigate = useNavigate();
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

  // Make project card a drop target for users
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `project-${project.id}`,
    data: { type: 'project-drop', projectId: project.id }
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

  const priorityConfig = {
    low: { 
      label: 'Baja', 
      classes: 'bg-emerald-600 hover:bg-emerald-500 shadow-md',
      badge: 'bg-white/30 text-white font-semibold',
      textClass: 'text-white',
      accent: 'border-t-4 border-t-white/30'
    },
    medium: { 
      label: 'Media', 
      classes: 'bg-yellow-700 hover:bg-orange-500 shadow-md',
      badge: 'bg-white/30 text-white font-semibold',
      textClass: 'text-white',
      accent: 'border-t-4 border-t-white/30'
    },
    high: { 
      label: 'Alta', 
      classes: 'bg-red-500 hover:bg-rose-600 shadow-md',
      badge: 'bg-white/30 text-white font-bold',
      textClass: 'text-white',
      accent: 'border-t-4 border-t-white/30'
    },
  };

  const handleMenuClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAction = (action, value) => {
    // If just toggling sub-options, don't close main menu
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
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    if (noteContent !== (project.quick_note || '')) {
      setNoteContent(project.quick_note || '');
    }
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

  // Handle card click - navigate to project if not dragging
  const handleCardClick = (e) => {
    // Don't navigate if clicking on interactive elements
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('textarea')) {
      return;
    }
    // Don't navigate if menu is open
    if (showMenu) {
      return;
    }
    // Navigate to project
    navigate(`/projects/${project.id}`);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      onClick={handleCardClick}
      className={`
        group relative rounded-xl cursor-pointer
        ${priorityConfig[effectivePriority]?.classes || 'border border-surface-border bg-surface-card'}
        ${priorityConfig[effectivePriority]?.accent || ''}
        ${isDragging ? 'opacity-20 grayscale border-dashed border-2' : ''}
        ${isOver && isUserDragging ? 'ring-2 ring-green-400 bg-green-900/30 scale-[1.02]' : ''}
        transition-all duration-200 mb-4
      `}
    >
      {/* Drag Handle - covers entire card but allows click through */}
      {!disableDrag && (
        <div 
          {...listeners} 
          {...attributes}
          className="absolute inset-0 z-0"
        />
      )}

      {/* Content */}
      <div className="relative z-10 p-5 pointer-events-none">
        {/* Header - Centered Title */}
        <div className="text-center mb-4">
          <h3 className={`text-2xl font-bold line-clamp-2 mb-1 ${priorityConfig[effectivePriority]?.textClass || 'text-text-primary'}`}>
            {project.name}
          </h3>
          <p className={`text-sm ${priorityConfig[effectivePriority]?.textClass ? 'text-white/70' : 'text-text-secondary'}`}>
            {project.client || 'Sin cliente'}
          </p>
        </div>

        {/* Menu Button - Top Right */}
        <div ref={menuRef} className="absolute top-3 right-3 pointer-events-auto">
          <button 
            onClick={handleMenuClick}
            className={`p-1.5 rounded-lg hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity ${priorityConfig[effectivePriority]?.textClass ? 'text-white/70 hover:text-white' : 'text-text-muted hover:text-text-primary'}`}
          >
            <MoreVertical size={18} />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-surface-card rounded-lg shadow-lg border border-surface-border py-1 z-50 animate-fade-in">
              <Link 
                to={`/projects/${project.id}`}
                className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-surface-hover flex items-center gap-3"
              >
                <ExternalLink size={14} /> Ver tablero de tareas
              </Link>
              
              <button 
                onClick={() => handleAction('edit')}
                className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-surface-hover flex items-center gap-3"
              >
                <Edit3 size={14} /> Editar proyecto
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
                    <button onClick={() => handleAction('update_priority', 'low')} className="block w-full text-left px-2 py-1 text-xs hover:bg-green-900/30 text-green-400 rounded">
                      🟢 Baja
                    </button>
                    <button onClick={() => handleAction('update_priority', 'medium')} className="block w-full text-left px-2 py-1 text-xs hover:bg-amber-900/30 text-amber-400 rounded">
                      🟡 Media
                    </button>
                    <button onClick={() => handleAction('update_priority', 'high')} className="block w-full text-left px-2 py-1 text-xs hover:bg-red-900/30 text-red-400 rounded">
                      🔴 Alta
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-surface-border my-1"></div>
              
              <button 
                onClick={() => handleAction('complete')}
                className="w-full px-4 py-2 text-left text-sm text-green-400 hover:bg-green-900/30 flex items-center gap-3"
              >
                <CheckCircle size={14} /> Completar proyecto
              </button>
              
              <button 
                onClick={() => handleAction('delete')}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/30 flex items-center gap-3"
              >
                <Trash2 size={14} /> Eliminar proyecto
              </button>
            </div>
          )}
        </div>

        {/* Priority & Deadline Badges - Centered */}
        <div className="flex justify-center gap-2 mb-4">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityConfig[effectivePriority]?.badge}`}>
            {priorityConfig[effectivePriority]?.label}
          </span>
          {project.deadline && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${priorityConfig[effectivePriority]?.textClass ? 'bg-white/20 text-white' : 'bg-badge-gray text-text-secondary'}`}>
              <Clock size={10} /> {formatDeadline(project.deadline)}
            </span>
          )}
        </div>

        {/* Quick Note - Larger & Bold */}
        <div className="mb-4 pointer-events-auto">
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
              className={`w-full text-base font-semibold p-4 border-2 rounded-xl focus:ring-2 outline-none resize-none ${priorityConfig[effectivePriority]?.textClass ? 'bg-white/15 text-white border-white/40 focus:ring-white/50 placeholder:text-white/50' : 'bg-surface-elevated text-text-primary border-surface-border focus:ring-accent-blue placeholder:text-text-muted'}`}
              rows={3}
              placeholder="Escribe una nota rápida..."
            />
          ) : (
            <div 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsEditingNote(true);
              }}
              className={`group/note cursor-pointer p-4 rounded-xl transition-all ${priorityConfig[effectivePriority]?.textClass ? 'bg-white/15 border-2 border-white/30 hover:border-white/50 hover:bg-white/20' : 'bg-surface-elevated border-2 border-surface-border hover:border-accent-blue/50'}`}
            >
              <p className={`text-base font-semibold line-clamp-3 min-h-[3rem] ${priorityConfig[effectivePriority]?.textClass || 'text-text-primary'}`}>
                {project.quick_note || <span className={`font-normal ${priorityConfig[effectivePriority]?.textClass ? 'text-white/40 italic' : 'text-text-muted italic'}`}>📝 Clic para agregar nota...</span>}
              </p>
            </div>
          )}
        </div>



        {/* Footer */}
        <div className={`flex items-center justify-between pt-2 border-t ${priorityConfig[effectivePriority]?.textClass ? 'border-white/20' : 'border-surface-border'}`}>
          <div className="flex items-center gap-3">
            {/* Project Members */}
            {project.project_members && project.project_members.length > 0 && (
              <div className="flex -space-x-2">
                {project.project_members.slice(0, 4).map((member, idx) => (
                  <div 
                    key={member.user_id || idx}
                    className={`w-6 h-6 rounded-full ${getAvatarColor(member.profiles?.full_name)} border-2 border-surface-card flex items-center justify-center text-white text-[10px] font-bold ring-1 ring-surface-border`}
                    title={member.profiles?.full_name || 'Miembro del equipo'}
                  >
                    {getInitial(member.profiles?.full_name)}
                  </div>
                ))}
                {project.project_members.length > 4 && (
                  <div className="w-6 h-6 rounded-full bg-surface-elevated border-2 border-surface-card flex items-center justify-center text-text-muted text-[10px] font-medium">
                    +{project.project_members.length - 4}
                  </div>
                )}
              </div>
            )}

            <div className={`flex items-center gap-1 text-xs ${priorityConfig[effectivePriority]?.textClass ? 'text-white/60' : 'text-text-muted'}`}>
              <Calendar size={12} />
              <span>{new Date(project.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          
          {/* View Tasks Link */}
          <Link 
            to={`/projects/${project.id}`}
            className={`text-xs font-medium pointer-events-auto flex items-center gap-1 ${priorityConfig[effectivePriority]?.textClass ? 'text-white/80 hover:text-white' : 'text-accent-blue hover:text-blue-400'}`}
            onClick={(e) => e.stopPropagation()}
          >
            Ver tareas <ExternalLink size={10} />
          </Link>
        </div>
      </div>

      {/* User Drop Indicator */}
      {isOver && isUserDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-xl pointer-events-none">
          <span className="text-green-400 text-sm font-medium px-3 py-1 bg-surface-card rounded-full shadow">
            Soltar para asignar
          </span>
        </div>
      )}
    </div>
  );
}
