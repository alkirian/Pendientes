import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';

const COLUMN_COLORS = {
  pending: {
    header: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    headerText: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200',
    border: 'border-amber-300 dark:border-amber-700',
    dot: 'bg-amber-500'
  },
  in_progress: {
    header: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    headerText: 'text-blue-700 dark:text-blue-400',
    badge: 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200',
    border: 'border-blue-300 dark:border-blue-700',
    dot: 'bg-blue-500'
  },
  review: {
    header: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    headerText: 'text-purple-700 dark:text-purple-400',
    badge: 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200',
    border: 'border-purple-300 dark:border-purple-700',
    dot: 'bg-purple-500'
  },
  approved: {
    header: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    headerText: 'text-emerald-700 dark:text-emerald-400',
    badge: 'bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200',
    border: 'border-emerald-300 dark:border-emerald-700',
    dot: 'bg-emerald-500'
  },
  delivered: {
    header: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    headerText: 'text-green-700 dark:text-green-400',
    badge: 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200',
    border: 'border-green-300 dark:border-green-700',
    dot: 'bg-green-500'
  },
};

export default function KanbanColumn({ id, title, tasks, onTaskClick, onQuickAction, isUserDragging }) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const count = tasks.length;
  const colors = COLUMN_COLORS[id] || COLUMN_COLORS.pending;

  return (
    <div 
      ref={setNodeRef} 
      className={`
        flex-shrink-0 w-80 flex flex-col rounded-xl h-full max-h-full
        bg-gray-50 dark:bg-gray-800/50 
        border-2 transition-all duration-200
        ${isOver ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/10 shadow-lg' : 'border-gray-200 dark:border-gray-700/50'}
      `}
    >
      {/* Column Header */}
      <div className={`p-4 rounded-t-xl border-b ${colors.header}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`}></span>
            <h3 className={`font-semibold ${colors.headerText}`}>
              {title}
            </h3>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
            {count}
          </span>
        </div>
      </div>

      {/* Tasks Container */}
      <div className="p-3 overflow-y-auto flex-1 custom-scrollbar">
        {tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onClick={() => onTaskClick(task)}
            onQuickAction={onQuickAction}
            isUserDragging={isUserDragging}
          />
        ))}
        
        {/* Empty State */}
        {tasks.length === 0 && (
          <div className={`
            h-32 border-2 border-dashed rounded-lg 
            flex flex-col items-center justify-center gap-2
            transition-all duration-200
            ${isOver 
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
              : `${colors.border} bg-gray-50/50 dark:bg-gray-800/30`
            }
          `}>
            <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-gray-400 text-sm italic">
              {isOver ? 'Soltar aquí' : 'Sin tareas'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
