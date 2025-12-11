import { useDroppable } from '@dnd-kit/core';
import ProjectCard from './ProjectCard';

const COLUMN_COLORS = {
  pending: {
    header: 'bg-amber-50 dark:bg-amber-900/20',
    headerText: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200',
    border: 'border-amber-200 dark:border-amber-700',
    dot: 'bg-amber-500'
  },
  active: {
    header: 'bg-blue-50 dark:bg-blue-900/20',
    headerText: 'text-blue-700 dark:text-blue-400',
    badge: 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200',
    border: 'border-blue-200 dark:border-blue-700',
    dot: 'bg-blue-500'
  },
  completed: {
    header: 'bg-green-50 dark:bg-green-900/20',
    headerText: 'text-green-700 dark:text-green-400',
    badge: 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200',
    border: 'border-green-200 dark:border-green-700',
    dot: 'bg-green-500'
  },
  on_hold: {
    header: 'bg-orange-50 dark:bg-orange-900/20',
    headerText: 'text-orange-700 dark:text-orange-400',
    badge: 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200',
    border: 'border-orange-200 dark:border-orange-700',
    dot: 'bg-orange-500'
  },
  archived: {
    header: 'bg-gray-50 dark:bg-gray-800',
    headerText: 'text-gray-600 dark:text-gray-400',
    badge: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-700',
    dot: 'bg-gray-500'
  },
};

export default function ProjectColumn({ id, title, projects, onQuickAction, isUserDragging }) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const count = projects.length;
  const colors = COLUMN_COLORS[id] || COLUMN_COLORS.pending;

  return (
    <div 
      ref={setNodeRef} 
      className={`
        flex-shrink-0 w-80 lg:w-96 flex flex-col rounded-xl h-full
        bg-gray-50/50 dark:bg-gray-800/30 
        border-2 transition-all duration-200
        ${isOver ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/10 shadow-lg' : 'border-gray-200 dark:border-gray-700/50'}
      `}
    >
      {/* Column Header */}
      <div className={`p-4 rounded-t-xl border-b ${colors.header} ${colors.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${colors.dot}`}></span>
            <h3 className={`font-bold text-lg ${colors.headerText}`}>
              {title}
            </h3>
          </div>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${colors.badge}`}>
            {count}
          </span>
        </div>
      </div>

      {/* Projects Container */}
      <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
        {projects.map(project => (
          <ProjectCard 
            key={project.id} 
            project={project}
            onQuickAction={onQuickAction}
            isUserDragging={isUserDragging}
          />
        ))}
        
        {/* Empty State */}
        {projects.length === 0 && (
          <div className={`
            h-40 border-2 border-dashed rounded-xl 
            flex flex-col items-center justify-center gap-3
            transition-all duration-200
            ${isOver 
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
              : `${colors.border} bg-white/50 dark:bg-gray-800/30`
            }
          `}>
            <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-gray-400 text-sm">
              {isOver ? 'Soltar proyecto aquí' : 'Sin proyectos'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
