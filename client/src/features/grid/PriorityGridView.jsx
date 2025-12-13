import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import ProjectCard from '../projects/ProjectCard';
import { calculateAutoPriority } from '../../utils/priorityUtils';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

// Priority order for sorting
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

// Droppable Priority Section Component
function DroppablePrioritySection({ priority, label, icon: Icon, projects, colorClass, onQuickAction, isUserDragging, isProjectDragging }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `priority-${priority}`,
    data: { type: 'priority-drop', priority }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`mb-8 p-4 rounded-xl transition-all duration-200 min-h-[120px] ${
        isOver 
          ? 'bg-surface-elevated ring-2 ring-accent-blue scale-[1.01]' 
          : isProjectDragging 
            ? 'bg-surface-secondary/50 ring-1 ring-dashed ring-surface-border' 
            : ''
      }`}
    >
      {/* Section Header */}
      <div className={`flex items-center gap-3 mb-4 pb-2 border-b ${colorClass}`}>
        <Icon size={20} />
        <h2 className="text-lg font-bold">{label}</h2>
        <span className="text-sm opacity-70">({projects.length})</span>
        {isOver && (
          <span className="ml-auto text-xs bg-accent-blue text-white px-2 py-1 rounded-full animate-pulse">
            Soltar aquí
          </span>
        )}
      </div>
      
      {/* Grid of Cards */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onQuickAction={onQuickAction}
              isUserDragging={isUserDragging}
              isProjectDragging={isProjectDragging}
            />
          ))}
        </div>
      ) : (
        <div className={`text-center py-8 rounded-lg border-2 border-dashed transition-all ${
          isOver 
            ? 'border-accent-blue bg-accent-blue/10' 
            : 'border-surface-border bg-surface-secondary/30'
        }`}>
          <p className="text-text-muted text-sm">
            {isOver ? '✨ Soltar para mover aquí' : 'Sin proyectos en esta categoría'}
          </p>
        </div>
      )}

      {/* Extra drop zone visible when dragging - to ensure drops work even with many cards */}
      {isProjectDragging && projects.length > 0 && (
        <div className={`mt-4 text-center py-4 rounded-lg border-2 border-dashed transition-all ${
          isOver 
            ? 'border-accent-blue bg-accent-blue/20' 
            : 'border-surface-border/50 bg-surface-secondary/20'
        }`}>
          <p className="text-text-muted text-xs">
            {isOver ? '✨ Soltar para agregar aquí' : '⬇️ Suelta aquí para agregar a esta prioridad'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function PriorityGridView({ projects, onQuickAction, isUserDragging, isProjectDragging }) {
  // Sort projects by priority (high first, then medium, then low)
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const priorityA = calculateAutoPriority(a.deadline, a.priority);
      const priorityB = calculateAutoPriority(b.deadline, b.priority);
      return PRIORITY_ORDER[priorityA] - PRIORITY_ORDER[priorityB];
    });
  }, [projects]);

  // Group by priority for section headers
  const groupedProjects = useMemo(() => {
    const groups = { high: [], medium: [], low: [] };
    sortedProjects.forEach(project => {
      const priority = calculateAutoPriority(project.deadline, project.priority);
      groups[priority].push(project);
    });
    return groups;
  }, [sortedProjects]);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={32} className="text-text-muted" />
        </div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">No hay proyectos</h3>
        <p className="text-text-secondary">Crea tu primer proyecto con el botón "Nuevo Proyecto"</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-2">
      {/* Stats Summary */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 text-rose-400 rounded-lg">
          <AlertTriangle size={18} />
          <span className="font-semibold">{groupedProjects.high.length}</span>
          <span className="text-sm">Urgentes</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg">
          <Clock size={18} />
          <span className="font-semibold">{groupedProjects.medium.length}</span>
          <span className="text-sm">En Progreso</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
          <CheckCircle2 size={18} />
          <span className="font-semibold">{groupedProjects.low.length}</span>
          <span className="text-sm">Normal</span>
        </div>
      </div>

      {/* Drag hint when dragging */}
      {isProjectDragging && (
        <div className="mb-4 p-3 bg-accent-blue/10 border border-accent-blue/30 rounded-lg text-center animate-fade-in">
          <p className="text-accent-blue text-sm font-medium">
            🎯 Arrastra el proyecto a otra sección para cambiar su prioridad
          </p>
        </div>
      )}

      {/* Priority Sections - Now Droppable */}
      <DroppablePrioritySection
        priority="high"
        label="🔴 Urgente"
        icon={AlertTriangle}
        projects={groupedProjects.high}
        colorClass="border-rose-500/50 text-rose-400"
        onQuickAction={onQuickAction}
        isUserDragging={isUserDragging}
        isProjectDragging={isProjectDragging}
      />
      
      <DroppablePrioritySection
        priority="medium"
        label="🟠 En Progreso"
        icon={Clock}
        projects={groupedProjects.medium}
        colorClass="border-orange-500/50 text-orange-400"
        onQuickAction={onQuickAction}
        isUserDragging={isUserDragging}
        isProjectDragging={isProjectDragging}
      />
      
      <DroppablePrioritySection
        priority="low"
        label="🟢 Normal"
        icon={CheckCircle2}
        projects={groupedProjects.low}
        colorClass="border-emerald-500/50 text-emerald-400"
        onQuickAction={onQuickAction}
        isUserDragging={isUserDragging}
        isProjectDragging={isProjectDragging}
      />
    </div>
  );
}
