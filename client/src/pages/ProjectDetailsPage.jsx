import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Calendar, Layout, List } from 'lucide-react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import ProjectOverview from '../features/projects/ProjectOverview';
import ProjectTaskList from '../features/projects/ProjectTaskList';
import CreateTaskModal from '../features/board/CreateTaskModal';
import TaskDetailModal from '../features/board/TaskDetailModal';
import UsersDraggablePanel from '../features/board/UsersDraggablePanel';
import { calculateAutoPriority, formatDeadline } from '../utils/priorityUtils';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [resources, setResources] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'tasks'
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Drag state (kept for User Panel integration if needed later)
  const [activeId, setActiveId] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [activeData, setActiveData] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const fetchProjectData = useCallback(async () => {
    setLoading(true);
    
    // 1. Fetch Project Details + Members
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        project_members (
          user_id,
          profiles (full_name, avatar_url)
        )
      `)
      .eq('id', id)
      .single();
    
    if (projectError) console.error('Error fetching project:', projectError);
    else {
        // Calculate progress logic (simple version)
        // In a real app, you might aggregate this via SQL or edge function
        setProject(projectData);
    }

    // 2. Fetch Tasks
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select(`
        *,
        assignments:task_assignments(user_id, profiles(full_name, avatar_url)),
        task_links(id)
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: true });

    if (taskError) console.error('Error fetching tasks:', taskError);
    else setTasks(taskData || []);

    // 3. Fetch Resources
    const { data: resourcesData, error: resourcesError } = await supabase
      .from('project_resources')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    if (resourcesError) console.error('Error fetching resources:', resourcesError);
    else setResources(resourcesData || []);

    if (projectData && taskData) {
        // Calculate derived progress
        const total = taskData.length;
        const completed = taskData.filter(t => t.status === 'completed' || t.status === 'delivered').length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        setProject(prev => ({ ...prev, progress, totalTasks: total, completedTasks: completed }));
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Drag handlers (Placeholder for future User Panel integration)
  const handleDragStart = () => {
    // Placeholder
  };

  const handleDragEnd = () => {
    // Placeholder
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 flex flex-col items-center justify-center text-gray-500">
      <h2 className="text-xl font-bold mb-2">Proyecto no encontrado</h2>
      <Link to="/" className="text-blue-500 hover:underline">Volver al Dashboard</Link>
    </div>
  );

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4">
                <div className="flex items-center gap-4 mb-4">
                    <Link to="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {project.name}
                            </h1>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                                project.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                project.status === 'active' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                project.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                                {project.status === 'pending' ? 'Pendiente' :
                                project.status === 'active' ? 'En Curso' :
                                project.status === 'completed' ? 'Completado' : project.status}
                            </span>
                            
                            {/* Priority Badge */}
                            {(() => {
                                const effective = calculateAutoPriority(project.deadline, project.priority);
                                const style = effective === 'high' ? 'bg-red-100 text-red-700 border-red-200' :
                                              effective === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                              'bg-green-100 text-green-700 border-green-200';
                                const label = effective === 'high' ? 'Alta' : effective === 'medium' ? 'Media' : 'Baja';
                                return (
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${style}`}>
                                        Prioridad {label}
                                    </span>
                                );
                            })()}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <p>{project.client}</p>
                            {project.deadline && (
                                <p className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                    <Calendar size={14} />
                                    {formatDeadline(project.deadline)}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="ml-auto flex gap-3">
                         <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm font-medium text-sm"
                          >
                            <Plus size={18} />
                            Nueva Tarea
                          </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex items-center gap-6 mt-6 border-b border-transparent">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'overview' 
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Layout size={18} />
                        Vista General
                    </button>
                    <button 
                        onClick={() => setActiveTab('tasks')}
                        className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'tasks' 
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <List size={18} />
                        Tareas
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full ml-1">
                            {tasks.length}
                        </span>
                    </button>
                </div>
            </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
            {activeTab === 'overview' ? (
                <div className="animate-fade-in">
                    <ProjectOverview 
                        project={project} 
                        resources={resources}
                        onUpdateProject={fetchProjectData}
                        onUpdateResources={fetchProjectData}
                    />
                </div>
            ) : (
                <div className="flex gap-6 animate-fade-in">
                    <div className="flex-1">
                        <ProjectTaskList 
                            tasks={tasks} 
                            onTaskClick={(task) => {
                                setSelectedTask(task);
                                setIsDetailOpen(true);
                            }}
                        />
                    </div>
                    {/* Optional: Keep UsersDraggablePanel on the side, even if drag to list isn't fully implemented yet, 
                        it sets the stage or can be used if we make list items droppable later.
                        For now, hiding it to keep the "List View" clean as per request to remove columns/complexity.
                    */}
                    {/* <div className="w-72 hidden xl:block">
                        <UsersDraggablePanel />
                    </div> */}
                </div>
            )}
        </main>

        {/* Modals */}
        <CreateTaskModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          projectId={id}
          onCreated={fetchProjectData}
        />

        <TaskDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          onUpdate={fetchProjectData}
        />

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
            <div className="bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3">
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
}
