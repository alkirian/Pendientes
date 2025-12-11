import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { Plus, Briefcase, Calendar, CheckCircle, Clock, Pause, Archive } from 'lucide-react';
import CreateProjectModal from './CreateProjectModal';

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'amber', icon: Clock },
  active: { label: 'En Curso', color: 'blue', icon: Briefcase },
  completed: { label: 'Completado', color: 'green', icon: CheckCircle },
  on_hold: { label: 'En Pausa', color: 'orange', icon: Pause },
  archived: { label: 'Archivado', color: 'gray', icon: Archive },
};

const TABS = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Pendientes', color: 'amber' },
  { id: 'active', label: 'En Curso', color: 'blue' },
  { id: 'completed', label: 'Completados', color: 'green' },
];

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [projectStats, setProjectStats] = useState({});

  const fetchProjects = useCallback(async () => {
    // Fetch projects with task counts
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        tasks (id, status)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Calculate stats per project
    const projectsWithStats = (data || []).map(project => {
      const tasks = project.tasks || [];
      const completedTasks = tasks.filter(t => t.status === 'delivered' || t.status === 'approved').length;
      const totalTasks = tasks.length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      return {
        ...project,
        completedTasks,
        totalTasks,
        progress
      };
    });

    setProjects(projectsWithStats);
    
    // Calculate tab counts
    const stats = {
      all: projectsWithStats.length,
      pending: projectsWithStats.filter(p => p.status === 'pending').length,
      active: projectsWithStats.filter(p => p.status === 'active').length,
      completed: projectsWithStats.filter(p => p.status === 'completed').length,
    };
    setProjectStats(stats);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = activeTab === 'all' 
    ? projects 
    : projects.filter(p => p.status === activeTab);

  const getBorderClass = (status) => {
    const colors = {
      pending: 'border-l-amber-500',
      active: 'border-l-blue-500',
      completed: 'border-l-green-500',
      on_hold: 'border-l-orange-500',
      archived: 'border-l-gray-500',
    };
    return colors[status] || colors.active;
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.active;
    const colorClasses = {
      amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses[config.color]}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Proyectos</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg shadow-blue-500/20"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Nuevo Proyecto</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {TABS.map(tab => {
          const count = projectStats[tab.id] || 0;
          const isActive = activeTab === tab.id;
          const colorClasses = {
            amber: 'bg-amber-500',
            blue: 'bg-blue-500',
            green: 'bg-green-500',
          };
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition whitespace-nowrap ${
                isActive 
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' 
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  isActive 
                    ? 'bg-white/20 text-white dark:bg-gray-900/30 dark:text-gray-900'
                    : tab.color 
                      ? `${colorClasses[tab.color]} text-white`
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {activeTab === 'all' ? 'No hay proyectos.' : `No hay proyectos ${TABS.find(t => t.id === activeTab)?.label.toLowerCase()}.`}
          </p>
          <button onClick={() => setShowModal(true)} className="text-blue-500 hover:text-blue-400 mt-2 font-medium">
             Crear proyecto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((project) => (
            <Link to={`/projects/${project.id}`} key={project.id} className="block group">
              <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 border-l-4 ${getBorderClass(project.status)} hover:shadow-lg transition h-full flex flex-col`}>
                
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:scale-110 transition">
                    <Briefcase size={20} />
                  </div>
                  {getStatusBadge(project.status)}
                </div>
                
                {/* Content */}
                <div className="mb-4 flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-500 transition line-clamp-1">{project.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{project.client}</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{project.completedTasks}/{project.totalTasks} tareas</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        project.progress === 100 
                          ? 'bg-green-500' 
                          : project.progress > 50 
                            ? 'bg-blue-500' 
                            : 'bg-amber-500'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center text-sm text-gray-400">
                  <Calendar size={14} className="mr-2" />
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      <CreateProjectModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onCreated={fetchProjects} 
      />
    </div>
  );
}
