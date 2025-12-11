import { useState, useEffect } from 'react';
import { Calendar, Users, BarChart2, Edit3, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ProjectResources from './ProjectResources';
import { formatDeadline } from '../../utils/priorityUtils';

export default function ProjectOverview({ project, resources, onUpdateProject, onUpdateResources }) {
  const [description, setDescription] = useState(project.description || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (description !== (project.description || '')) {
      setDescription(project.description || '');
    }
  }, [project.description]);

  const handleSaveDescription = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('projects')
      .update({ description })
      .eq('id', project.id);
    
    if (!error) {
      setIsEditing(false);
      onUpdateProject();
    }
    setLoading(false);
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    return colors[name ? name.charCodeAt(0) % colors.length : 0];
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Left Column: Context (Brief + Resources) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Project Brief */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileTextIcon size={18} className="text-gray-500" />
              Brief del Proyecto
            </h3>
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-blue-600 transition"
              >
                <Edit3 size={18} />
              </button>
            ) : (
              <button 
                onClick={handleSaveDescription}
                disabled={loading}
                className="p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg text-green-600 transition"
              >
                <CheckCircle2 size={20} />
              </button>
            )}
          </div>

          {isEditing ? (
            <textarea
              className="w-full h-32 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el objetivo y alcance del proyecto..."
            />
          ) : (
            <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {description || <span className="text-gray-400 italic">Sin descripción definida. Haz clic en editar para agregar una.</span>}
            </div>
          )}
        </div>

        {/* Resources */}
        <ProjectResources 
          projectId={project.id} 
          resources={resources} 
          onUpdate={onUpdateResources} 
        />
      </div>

      {/* Right Column: Metadata */}
      <div className="space-y-6">
        {/* Statistics Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Metricas</h4>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Progreso General</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {project.progress || 0}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full mb-6 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              style={{ width: `${project.progress || 0}%` }}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="block text-2xl font-bold text-gray-900 dark:text-white">
                {project.completedTasks || 0}
              </span>
              <span className="text-xs text-gray-500">Completadas</span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="block text-2xl font-bold text-gray-900 dark:text-white">
                {project.totalTasks || 0}
              </span>
              <span className="text-xs text-gray-500">Totales</span>
            </div>
          </div>
        </div>

        {/* Team Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Equipo</h4>
          <div className="flex flex-wrap gap-2">
            {project.project_members && project.project_members.length > 0 ? (
              project.project_members.map((member, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-full border border-gray-100 dark:border-gray-700"
                >
                  <div className={`w-6 h-6 rounded-full ${getAvatarColor(member.profiles?.full_name)} flex items-center justify-center text-white text-[10px] font-bold`}>
                    {getInitial(member.profiles?.full_name)}
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {member.profiles?.full_name || 'Usuario'}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-sm text-gray-400 italic">Sin miembros asignados</span>
            )}
          </div>
        </div>

        {/* Dates Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Fechas</h4>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Creado el</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            {/* Deadline */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-pink-500 flex items-center justify-center">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Fecha de Entrega</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {project.deadline ? formatDeadline(project.deadline) : 'Sin fecha definida'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon helper
function FileTextIcon({ size, className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}
