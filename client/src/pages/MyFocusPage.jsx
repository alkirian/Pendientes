import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { format, isToday, isPast, addDays, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Target, Calendar, Clock, CheckCircle2, AlertCircle, ArrowRight, Briefcase } from 'lucide-react';
import { calculateAutoPriority } from '../utils/priorityUtils';

export default function MyFocusPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (data && !error) {
        setUserName(data.full_name?.split(' ')[0] || 'Usuario');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchMyProjects = async () => {
    setLoading(true);
    try {
      // Get project IDs where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      const projectIds = memberData?.map(m => m.project_id) || [];

      if (projectIds.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }

      // Fetch the actual projects
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds)
        .neq('status', 'completed')
        .order('deadline', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setProjects(data || []);

    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyProjects();
      fetchUserProfile();
    }
  }, [user]);

  // Group projects by urgency
  const groupedProjects = {
    immediate: [], // Overdue or Today
    upcoming: [],  // Next 7 days
    later: []      // > 7 days or No Date
  };

  projects.forEach(project => {
    const priority = calculateAutoPriority(project.deadline, project.priority);
    
    if (!project.deadline) {
      groupedProjects.later.push({ ...project, effectivePriority: priority });
      return;
    }

    const date = parseISO(project.deadline);
    const today = new Date();
    
    if (isPast(date) && !isToday(date)) {
      groupedProjects.immediate.push({ ...project, isOverdue: true, effectivePriority: priority });
    } else if (isToday(date)) {
      groupedProjects.immediate.push({ ...project, isToday: true, effectivePriority: priority });
    } else if (isWithinInterval(date, { start: today, end: addDays(today, 7) })) {
      groupedProjects.upcoming.push({ ...project, effectivePriority: priority });
    } else {
      groupedProjects.later.push({ ...project, effectivePriority: priority });
    }
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const priorityColors = {
    high: 'bg-rose-500',
    medium: 'bg-orange-400',
    low: 'bg-emerald-500'
  };

  const EmptyState = ({ message }) => (
    <div className="text-center py-8 text-text-muted bg-surface-secondary rounded-xl border-2 border-dashed border-surface-border">
      <p className="text-sm">{message}</p>
    </div>
  );

  const ProjectCard = ({ project, isOverdue, isToday }) => (
    <Link 
      to={`/projects/${project.id}`}
      className={`block p-4 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition-all group ${
        priorityColors[project.effectivePriority]
      } ${
        isOverdue 
          ? 'ring-2 ring-red-300' 
          : isToday
            ? 'ring-2 ring-amber-300'
            : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/30 text-white">
          {project.client || 'Sin cliente'}
        </span>
        {project.effectivePriority === 'high' && (
          <span className="text-xs font-bold text-white flex items-center gap-1">
            <AlertCircle size={12} /> Urgente
          </span>
        )}
      </div>
      <h3 className="font-bold text-white mb-2 text-lg group-hover:underline">
        {project.name}
      </h3>
      <div className="flex items-center text-xs text-white/80 gap-3">
        {project.deadline && (
          <span className={`flex items-center gap-1 ${
            isOverdue ? 'font-bold' : isToday ? 'font-bold' : ''
          }`}>
            <Clock size={12} />
            {isToday ? 'Hoy' : isOverdue ? 'Vencido' : format(parseISO(project.deadline), "d MMM", { locale: es })}
          </span>
        )}
        {project.quick_note && (
          <span className="truncate max-w-[150px]">
            📝 {project.quick_note}
          </span>
        )}
      </div>
    </Link>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-surface-primary">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-primary p-6 pb-20">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-text-primary">
              {getGreeting()}, {userName}
            </h1>
            <Link 
              to="/" 
              className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-accent-blue transition-colors"
            >
              Ir al Dashboard <ArrowRight size={16} />
            </Link>
          </div>
          <p className="text-text-secondary text-lg flex items-center gap-2">
            Tienes <strong className="text-accent-blue">{groupedProjects.immediate.length} proyectos</strong> que requieren tu atención inmediata.
          </p>
        </header>

        <div className="grid gap-8">
          
          {/* Section 1: Immediate Attention */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 text-red-400 rounded-lg">
                <AlertCircle size={20} />
              </div>
              <h2 className="text-xl font-bold text-text-primary">
                Atención Inmediata
              </h2>
              <span className="bg-surface-secondary text-text-muted px-2 py-0.5 rounded-full text-sm font-medium">
                {groupedProjects.immediate.length}
              </span>
            </div>
            
            {groupedProjects.immediate.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedProjects.immediate.map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    isOverdue={project.isOverdue} 
                    isToday={project.isToday} 
                  />
                ))}
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
                <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2" />
                <p className="text-emerald-400 font-medium">¡Todo al día! No tienes proyectos urgentes.</p>
              </div>
            )}
          </section>

          {/* Section 2: Upcoming */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                <Calendar size={20} />
              </div>
              <h2 className="text-xl font-bold text-text-primary">
                Próxima Semana
              </h2>
              <span className="bg-surface-secondary text-text-muted px-2 py-0.5 rounded-full text-sm font-medium">
                {groupedProjects.upcoming.length}
              </span>
            </div>

            {groupedProjects.upcoming.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedProjects.upcoming.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <EmptyState message="Nada programado para los próximos 7 días." />
            )}
          </section>

          {/* Section 3: Later / No Date */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-surface-secondary text-text-muted rounded-lg">
                <Target size={20} />
              </div>
              <h2 className="text-xl font-bold text-text-primary">
                Para Después / Sin Fecha
              </h2>
              <span className="bg-surface-secondary text-text-muted px-2 py-0.5 rounded-full text-sm font-medium">
                {groupedProjects.later.length}
              </span>
            </div>

            {groupedProjects.later.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedProjects.later.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <EmptyState message="Sin proyectos pendientes para más adelante." />
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
