import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Archive, ArrowLeft, Calendar, Search, RotateCcw, Briefcase, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ArchivedPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchArchivedProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_members (
          user_id,
          profiles (full_name)
        )
      `)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching archived projects:', error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchArchivedProjects();
  }, []);

  // Reactivate a project
  const handleReactivate = async (projectId, projectName) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          status: 'active',
          completed_at: null
        })
        .eq('id', projectId);
        
      if (error) throw error;
      
      showToast(`✅ "${projectName}" reactivado`);
      fetchArchivedProjects();
    } catch (error) {
      console.error('Error reactivating project:', error);
      showToast('❌ Error al reactivar proyecto', 'error');
    }
  };

  // Filter by search
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;
    const term = searchTerm.toLowerCase();
    return projects.filter(p => 
      p.name?.toLowerCase().includes(term) ||
      p.client?.toLowerCase().includes(term)
    );
  }, [projects, searchTerm]);

  // Group by month/year
  const groupedProjects = useMemo(() => {
    const groups = {};
    filteredProjects.forEach(project => {
      const date = project.completed_at ? parseISO(project.completed_at) : new Date();
      const key = format(date, 'MMMM yyyy', { locale: es });
      if (!groups[key]) groups[key] = [];
      groups[key].push(project);
    });
    return groups;
  }, [filteredProjects]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-primary">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Header */}
      <header className="bg-surface-card border-b border-surface-border sticky top-0 z-20">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link 
              to="/"
              className="p-2 hover:bg-surface-hover rounded-lg text-text-muted transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                <Archive size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">
                  Proyectos Archivados
                </h1>
                <p className="text-xs text-text-secondary">
                  {projects.length} proyecto{projects.length !== 1 ? 's' : ''} completado{projects.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-surface-secondary border border-surface-border rounded-lg text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent-blue focus:border-transparent outline-none w-64"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-6xl mx-auto">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-surface-elevated rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={40} className="text-text-muted" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">No hay proyectos archivados</h3>
            <p className="text-text-secondary mb-4">Los proyectos que completes aparecerán aquí</p>
            <Link 
              to="/"
              className="text-accent-blue hover:underline font-medium"
            >
              Volver al Dashboard
            </Link>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-text-muted">No se encontraron proyectos con "{searchTerm}"</p>
          </div>
        ) : (
          Object.entries(groupedProjects).map(([month, monthProjects]) => (
            <div key={month} className="mb-8">
              {/* Month Header */}
              <div className="flex items-center gap-3 mb-4">
                <Calendar size={18} className="text-text-muted" />
                <h2 className="text-lg font-semibold text-text-primary capitalize">{month}</h2>
                <span className="text-sm text-text-muted">({monthProjects.length})</span>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {monthProjects.map(project => (
                  <div 
                    key={project.id}
                    className="bg-surface-card border border-surface-border rounded-xl p-4 hover:border-surface-hover transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                          <Briefcase size={18} className="text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-text-primary line-clamp-1">{project.name}</h3>
                          <p className="text-sm text-text-secondary line-clamp-1">
                            {project.client || 'Sin cliente'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded-full">
                        ✓ Completado
                      </span>
                    </div>

                    {project.completed_at && (
                      <p className="text-xs text-text-muted mb-3">
                        Completado el {format(parseISO(project.completed_at), "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    )}

                    {project.quick_note && (
                      <p className="text-sm text-text-secondary bg-surface-secondary p-2 rounded-lg mb-3 line-clamp-2">
                        {project.quick_note}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-surface-border">
                      <Link 
                        to={`/projects/${project.id}`}
                        className="text-xs text-accent-blue hover:underline"
                      >
                        Ver detalles
                      </Link>
                      <button
                        onClick={() => handleReactivate(project.id, project.name)}
                        className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition"
                      >
                        <RotateCcw size={12} /> Reactivar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div className={`px-5 py-3 rounded-xl ${
            toast.type === 'error' ? 'bg-red-900 text-red-200' : 'bg-surface-elevated text-text-primary'
          }`}>
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
