import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar, Link2, MoreVertical, Edit3, Trash2, UserPlus, Flag, ArrowRight } from 'lucide-react';

export default function TaskCard({ task, onClick, onQuickAction, isUserDragging }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const menuRef = useRef(null);
  const nodeRef = useRef(null);

  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { type: 'task', task }
  });

  // Make task card a drop target for users
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `task-drop-${task.id}`,
    data: { type: 'task-drop', taskId: task.id }
  });

  // Properly combine refs using useCallback
  const setCombinedRef = useCallback((node) => {
    nodeRef.current = node;
    setDragRef(node);
    setDropRef(node);
  }, [setDragRef, setDropRef]);

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
  } : undefined;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setShowPriorityMenu(false);
        setShowStatusMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const priorityConfig = {
    low: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'Baja' },
    medium: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', label: 'Media' },
    high: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', label: 'Alta' },
    critical: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', label: 'Crítica' },
  };

  const statusConfig = {
    pending: { label: 'Pendiente' },
    in_progress: { label: 'En Curso' },
    review: { label: 'Revisión' },
    approved: { label: 'Aprobado' },
    delivered: { label: 'Entregado' },
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';
  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const assignees = task.assignments || [];
  const hasLinks = task.links_count > 0 || (task.task_links && task.task_links.length > 0);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAction = (action, value) => {
    setShowMenu(false);
    setShowPriorityMenu(false);
    setShowStatusMenu(false);
    if (onQuickAction) {
      onQuickAction(task.id, action, value);
    }
  };

  return (
    <div 
      ref={setCombinedRef} 
      style={style} 
      className={`
        group relative bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-2 
        ${isDragging ? 'opacity-50 shadow-2xl scale-105 border-blue-400' : 'border-gray-200 dark:border-gray-700'}
        ${isOver && isUserDragging ? 'border-green-400 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-400' : ''}
        cursor-grab active:cursor-grabbing hover:shadow-lg hover:border-blue-400 
        transition-all duration-200 mb-3
      `}
    >
      {/* Drag Handle */}
      <div 
        {...listeners} 
        {...attributes}
        className="absolute inset-0 z-0"
        onClick={onClick}
      />

      {/* Content Layer */}
      <div className="relative z-10 pointer-events-none">
        <div className="flex justify-between items-start mb-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${priorityConfig[task.priority]?.color || priorityConfig.medium.color}`}>
            {priorityConfig[task.priority]?.label || task.priority?.toUpperCase()}
          </span>
          
          <div className="flex items-center gap-2 pointer-events-auto">
            {task.deadline && (
              <span className={`text-xs flex items-center ${new Date(task.deadline) < new Date() ? 'text-red-500' : 'text-gray-400'}`}>
                <Calendar size={12} className="mr-1" />
                {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
            
            {/* 3-dot Menu Button */}
            <div ref={menuRef} className="relative">
              <button 
                onClick={handleMenuClick}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical size={16} />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <button 
                    onClick={() => { onClick(); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                  >
                    <Edit3 size={14} /> Editar detalles
                  </button>
                  
                  <button 
                    onClick={() => handleAction('assign')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                  >
                    <UserPlus size={14} /> Asignar responsable
                  </button>

                  {/* Priority Submenu */}
                  <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowPriorityMenu(!showPriorityMenu); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                    >
                      <Flag size={14} /> Cambiar prioridad
                      <ArrowRight size={12} className="ml-auto" />
                    </button>
                    {showPriorityMenu && (
                      <div className="absolute left-full top-0 ml-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1">
                        {Object.entries(priorityConfig).map(([key, config]) => (
                          <button
                            key={key}
                            onClick={() => handleAction('priority', key)}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${task.priority === key ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${config.color.split(' ')[0]}`}></span>
                            {config.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status Submenu */}
                  <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowStatusMenu(!showStatusMenu); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                    >
                      <ArrowRight size={14} /> Mover a...
                      <ArrowRight size={12} className="ml-auto" />
                    </button>
                    {showStatusMenu && (
                      <div className="absolute left-full top-0 ml-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1">
                        {Object.entries(statusConfig).map(([key, config]) => (
                          <button
                            key={key}
                            onClick={() => handleAction('status', key)}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${task.status === key ? 'bg-gray-100 dark:bg-gray-700 font-medium' : ''}`}
                          >
                            {config.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  
                  <button 
                    onClick={() => handleAction('delete')}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
                  >
                    <Trash2 size={14} /> Eliminar tarea
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <h4 className="text-gray-900 dark:text-gray-100 font-medium text-sm mb-1 line-clamp-2">{task.title}</h4>
        {task.description && (
          <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 mb-3">{task.description}</p>
        )}
        
        <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700/50 pt-2">
          {/* Links indicator */}
          <div className="flex items-center gap-2">
            {hasLinks && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Link2 size={12} />
                <span>{task.task_links?.length || task.links_count}</span>
              </div>
            )}
          </div>
          
          {/* Quick Add User Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); handleAction('assign'); }}
            className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto"
            title="Asignar usuario"
          >
            <UserPlus size={12} />
          </button>
        </div>

        {/* Assigned Users Section - More visible */}
        {assignees.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-2 flex-wrap">
              {assignees.map((assignment, idx) => (
                <div 
                  key={assignment.user_id || idx}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getAvatarColor(assignment.profiles?.full_name)} bg-opacity-20 dark:bg-opacity-30`}
                  style={{ backgroundColor: `${getAvatarColor(assignment.profiles?.full_name).replace('bg-', '')}20` }}
                >
                  <div className={`w-5 h-5 rounded-full ${getAvatarColor(assignment.profiles?.full_name)} flex items-center justify-center text-white text-[10px] font-bold`}>
                    {getInitial(assignment.profiles?.full_name)}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 max-w-[80px] truncate">
                    {assignment.profiles?.full_name || 'Usuario'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Drop Indicator */}
      {isOver && isUserDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 rounded-lg border-2 border-green-500 pointer-events-none">
          <span className="text-green-600 dark:text-green-400 text-sm font-medium">Soltar para asignar</span>
        </div>
      )}
    </div>
  );
}
