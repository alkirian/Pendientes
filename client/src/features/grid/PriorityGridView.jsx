import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import ProjectCard from '../projects/ProjectCard';
import { calculateAutoPriority } from '../../utils/priorityUtils';
import { AlertTriangle, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

// Orden de prioridades para ordenar
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

// Configuración de cada prioridad
const PRIORITY_CONFIG = {
  high: {
    id: 'high',
    label: 'Urgente',
    emoji: '🔴',
    icon: AlertTriangle,
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    headerBg: 'bg-gradient-to-r from-red-500/20 to-red-500/5',
    textColor: 'text-red-400',
    accentColor: 'border-l-red-500',
  },
  medium: {
    id: 'medium',
    label: 'En Progreso',
    emoji: '🟠',
    icon: Clock,
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    headerBg: 'bg-gradient-to-r from-amber-500/20 to-amber-500/5',
    textColor: 'text-amber-400',
    accentColor: 'border-l-amber-500',
  },
  low: {
    id: 'low',
    label: 'Normal',
    emoji: '🟢',
    icon: CheckCircle2,
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    headerBg: 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5',
    textColor: 'text-emerald-400',
    accentColor: 'border-l-emerald-500',
  },
};

// Componente de sección de prioridad (swim lane)
function PriorityLane({ config, projects, onQuickAction, isUserDragging, isProjectDragging, onOpenModal }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `priority-${config.id}`,
    data: { type: 'priority-drop', priority: config.id }
  });

  const Icon = config.icon;

  return (
    <div 
      ref={setNodeRef}
      className={`
        rounded-xl border-2 transition-all duration-200 overflow-hidden
        ${isOver 
          ? 'border-accent-blue bg-accent-blue/5 scale-[1.005]' 
          : isProjectDragging 
            ? `${config.borderColor} border-dashed opacity-90`
            : `${config.borderColor} border-solid`
        }
      `}
    >
      {/* Header de la sección */}
      <div className={`${config.headerBg} px-5 py-3 flex items-center justify-between border-b ${config.borderColor}`}>
        <div className="flex items-center gap-3">
          <span className="text-xl">{config.emoji}</span>
          <div>
            <h3 className={`font-bold ${config.textColor}`}>{config.label}</h3>
            <p className="text-xs text-text-muted">{projects.length} proyecto{projects.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        {isOver && (
          <span className="text-xs bg-accent-blue text-white px-3 py-1 rounded-full animate-pulse">
            Soltar aquí
          </span>
        )}
        
        {!isOver && projects.length > 0 && (
          <ChevronRight size={18} className="text-text-muted" />
        )}
      </div>

      {/* Grid de tarjetas */}
      <div className={`p-4 ${config.bgColor} min-h-[100px]`}>
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {projects.map(project => (
              <div 
                key={project.id} 
                className={`border-l-4 ${config.accentColor} rounded-lg overflow-hidden`}
              >
                <ProjectCard
                  project={project}
                  onQuickAction={onQuickAction}
                  isUserDragging={isUserDragging}
                  isProjectDragging={isProjectDragging}
                  onOpenModal={onOpenModal}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={`
            flex items-center justify-center py-8 rounded-lg border-2 border-dashed
            ${isOver 
              ? 'border-accent-blue bg-accent-blue/10' 
              : 'border-surface-border bg-surface-secondary/30'
            }
          `}>
            <div className="text-center">
              <Icon size={24} className="mx-auto mb-2 text-text-muted opacity-50" />
              <p className="text-text-muted text-sm">
                {isOver ? '✨ Suelta para agregar aquí' : 'Sin proyectos en esta categoría'}
              </p>
            </div>
          </div>
        )}

        {/* Zona de drop adicional cuando hay proyectos y se está arrastrando */}
        {isProjectDragging && projects.length > 0 && (
          <div className={`
            mt-3 py-3 rounded-lg border-2 border-dashed text-center transition-all
            ${isOver 
              ? 'border-accent-blue bg-accent-blue/10' 
              : 'border-surface-border/50 bg-surface-secondary/20'
            }
          `}>
            <p className="text-text-muted text-xs">
              {isOver ? '✨ Soltar aquí' : '⬇️ Arrastra aquí para cambiar prioridad'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente principal
export default function PriorityGridView({ projects, onQuickAction, isUserDragging, isProjectDragging, onOpenModal }) {
  // Ordenar proyectos por prioridad
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const priorityA = calculateAutoPriority(a.deadline, a.priority);
      const priorityB = calculateAutoPriority(b.deadline, b.priority);
      return PRIORITY_ORDER[priorityA] - PRIORITY_ORDER[priorityB];
    });
  }, [projects]);

  // Agrupar por prioridad
  const groupedProjects = useMemo(() => {
    const groups = { high: [], medium: [], low: [] };
    sortedProjects.forEach(project => {
      const priority = calculateAutoPriority(project.deadline, project.priority);
      groups[priority].push(project);
    });
    return groups;
  }, [sortedProjects]);

  // Estado vacío
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <div className="w-20 h-20 bg-surface-elevated rounded-2xl flex items-center justify-center mb-4">
          <CheckCircle2 size={40} className="text-text-muted" />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">Sin proyectos activos</h3>
        <p className="text-text-secondary max-w-sm">
          Crea tu primer proyecto con el botón "Nuevo" en la esquina superior
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-2 space-y-4">
      {/* Resumen de estadísticas */}
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-secondary rounded-xl border border-surface-border">
          <span className="text-lg">📊</span>
          <span className="text-sm font-medium text-text-primary">{projects.length} Total</span>
        </div>
        
        {groupedProjects.high.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
            <span>🔴</span>
            <span className="text-sm font-semibold text-red-400">{groupedProjects.high.length}</span>
            <span className="text-xs text-red-400/80">urgentes</span>
          </div>
        )}
        
        {groupedProjects.medium.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <span>🟠</span>
            <span className="text-sm font-semibold text-amber-400">{groupedProjects.medium.length}</span>
            <span className="text-xs text-amber-400/80">en progreso</span>
          </div>
        )}
        
        {groupedProjects.low.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <span>🟢</span>
            <span className="text-sm font-semibold text-emerald-400">{groupedProjects.low.length}</span>
            <span className="text-xs text-emerald-400/80">normal</span>
          </div>
        )}
      </div>

      {/* Indicador de arrastre */}
      {isProjectDragging && (
        <div className="p-3 bg-accent-blue/10 border border-accent-blue/30 rounded-xl text-center animate-fade-in">
          <p className="text-accent-blue text-sm font-medium">
            🎯 Arrastra el proyecto a otra sección para cambiar su prioridad
          </p>
        </div>
      )}

      {/* Swim Lanes de Prioridad */}
      <PriorityLane
        config={PRIORITY_CONFIG.high}
        projects={groupedProjects.high}
        onQuickAction={onQuickAction}
        isUserDragging={isUserDragging}
        isProjectDragging={isProjectDragging}
        onOpenModal={onOpenModal}
      />

      <PriorityLane
        config={PRIORITY_CONFIG.medium}
        projects={groupedProjects.medium}
        onQuickAction={onQuickAction}
        isUserDragging={isUserDragging}
        isProjectDragging={isProjectDragging}
        onOpenModal={onOpenModal}
      />

      <PriorityLane
        config={PRIORITY_CONFIG.low}
        projects={groupedProjects.low}
        onQuickAction={onQuickAction}
        isUserDragging={isUserDragging}
        isProjectDragging={isProjectDragging}
        onOpenModal={onOpenModal}
      />
    </div>
  );
}
