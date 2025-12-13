import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Calendar, Check, X, Pencil, Users } from 'lucide-react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, useDroppable } from '@dnd-kit/core';
import ProjectOverview from '../features/projects/ProjectOverview';
import UsersDraggablePanel from '../features/board/UsersDraggablePanel';
import { calculateAutoPriority } from '../utils/priorityUtils';

// Droppable zone component for the project header
function DroppableProjectZone({ projectId, children, isOver }) {
  const { setNodeRef } = useDroppable({
    id: `project-${projectId}`,
    data: { type: 'project-drop', projectId }
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`transition-all rounded-xl ${
        isOver ? 'ring-2 ring-accent-blue ring-offset-2 ring-offset-surface-card bg-blue-50/10' : ''
      }`}
    >
      {children}
    </div>
  );
}

// Inline Editable Field Component
function EditableField({ value, onSave, type = 'text', className = '', placeholder = '' }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className={`bg-surface-secondary border border-accent-blue rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-accent-blue ${className}`}
        />
        <button onClick={handleSave} className="p-1 text-green-500 hover:bg-green-100 rounded">
          <Check size={16} />
        </button>
        <button onClick={handleCancel} className="p-1 text-red-400 hover:bg-red-100 rounded">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <span 
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-surface-hover px-1 rounded transition-colors group inline-flex items-center gap-1 ${className}`}
      title="Click para editar"
    >
      {value || <span className="text-text-muted italic">{placeholder}</span>}
      <Pencil size={12} className="opacity-0 group-hover:opacity-50 text-text-muted" />
    </span>
  );
}

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Drag state for User Panel integration
  const [activeId, setActiveId] = useState(null);
  const [activeData, setActiveData] = useState(null);
  const [isUserDragging, setIsUserDragging] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Update project field in database
  const updateProjectField = async (field, value) => {
    const { error } = await supabase
      .from('projects')
      .update({ [field]: value })
      .eq('id', id);
    
    if (error) {
      showToast('Error al guardar', 'error');
      console.error('Update error:', error);
    } else {
      setProject(prev => ({ ...prev, [field]: value }));
      showToast('Guardado ✓');
    }
  };

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
        setProject(projectData);
    }

    // 2. Fetch Resources
    const { data: resourcesData, error: resourcesError } = await supabase
      .from('project_resources')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    if (resourcesError) console.error('Error fetching resources:', resourcesError);
    else setResources(resourcesData || []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Drag handlers for User assignment
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    if (active.data.current?.type === 'user') {
      setIsUserDragging(true);
      setActiveData(active.data.current.user);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!over) {
      resetDragState();
      return;
    }

    // Handle user drop on project
    if (active.data.current?.type === 'user' && over.data.current?.type === 'project-drop') {
      const userId = active.data.current.user.id;
      const userName = active.data.current.user.full_name || 'Usuario';
      
      // Check if already a member
      const existingMember = project?.project_members?.find(m => m.user_id === userId);
      if (existingMember) {
        showToast(`${userName} ya es miembro del proyecto`, 'info');
        resetDragState();
        return;
      }

      // Insert into project_members
      const { error } = await supabase
        .from('project_members')
        .insert([{ project_id: id, user_id: userId }]);
      
      if (!error) {
        showToast(`✅ ${userName} agregado al equipo`);
        fetchProjectData();
      } else {
        console.error('Error assigning team member:', error);
        showToast('❌ Error al asignar usuario', 'error');
      }
    }
    
    resetDragState();
  };

  const resetDragState = () => {
    setActiveId(null);
    setActiveData(null);
    setIsUserDragging(false);
  };

  // Remove team member
  const handleRemoveMember = async (userId, userName) => {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', id)
      .eq('user_id', userId);
    
    if (!error) {
      showToast(`${userName} removido del equipo`);
      fetchProjectData();
    } else {
      console.error('Error removing member:', error);
      showToast('❌ Error al remover miembro', 'error');
    }
  };

  // Avatar helpers
  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';
  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    return colors[name ? name.charCodeAt(0) % colors.length : 0];
  };

  if (loading) return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue"></div>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-surface-primary p-8 flex flex-col items-center justify-center text-text-secondary">
      <h2 className="text-xl font-bold mb-2 text-text-primary">Proyecto no encontrado</h2>
      <Link to="/" className="text-accent-blue hover:underline">Volver al Dashboard</Link>
    </div>
  );

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={resetDragState}>
      <div className="min-h-screen bg-surface-primary flex">
        {/* Sidebar with Users Panel */}
        <aside className="w-72 p-4 border-r border-surface-border bg-surface-secondary overflow-y-auto hidden lg:block shrink-0">
          <UsersDraggablePanel />
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <DroppableProjectZone projectId={id} isOver={isUserDragging}>
            <header className="bg-surface-card shadow-sm border-b border-surface-border">
            <div className="px-6 py-4">
                <div className="flex items-center gap-4 mb-4">
                    <Link to="/" className="p-2 hover:bg-surface-hover rounded-lg text-text-muted transition">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <EditableField 
                              value={project.name} 
                              onSave={(val) => updateProjectField('name', val)}
                              className="text-2xl font-bold text-text-primary"
                              placeholder="Nombre del proyecto"
                            />
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
                        <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                            <div className="flex items-center gap-1">
                              <span className="text-text-muted">Cliente:</span>
                              <EditableField 
                                value={project.client} 
                                onSave={(val) => updateProjectField('client', val)}
                                placeholder="Sin cliente"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar size={14} className="text-text-muted" />
                              <EditableField 
                                value={project.deadline?.split('T')[0] || ''} 
                                onSave={(val) => updateProjectField('deadline', val)}
                                type="date"
                                placeholder="Sin fecha"
                              />
                            </div>
                        </div>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                         {/* Team Members Display */}
                         <div className="flex items-center gap-2">
                           <Users size={16} className="text-text-muted" />
                           <span className="text-xs text-text-muted mr-1">Equipo:</span>
                           {project.project_members?.length > 0 ? (
                             <div className="flex -space-x-2">
                               {project.project_members.slice(0, 5).map((member) => (
                                 <div 
                                   key={member.user_id} 
                                   className="relative group"
                                   title={member.profiles?.full_name || 'Usuario'}
                                 >
                                   {member.profiles?.avatar_url ? (
                                     <img 
                                       src={member.profiles.avatar_url} 
                                       alt={member.profiles.full_name}
                                       className="w-8 h-8 rounded-full border-2 border-surface-card object-cover"
                                     />
                                   ) : (
                                     <div className={`w-8 h-8 rounded-full border-2 border-surface-card ${getAvatarColor(member.profiles?.full_name)} flex items-center justify-center text-white font-bold text-xs`}>
                                       {getInitial(member.profiles?.full_name)}
                                     </div>
                                   )}
                                   {/* Remove button on hover */}
                                   <button
                                     onClick={() => handleRemoveMember(member.user_id, member.profiles?.full_name)}
                                     className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                     title="Remover del equipo"
                                   >
                                     <X size={10} />
                                   </button>
                                 </div>
                               ))}
                               {project.project_members.length > 5 && (
                                 <div className="w-8 h-8 rounded-full border-2 border-surface-card bg-surface-secondary flex items-center justify-center text-xs text-text-muted">
                                   +{project.project_members.length - 5}
                                 </div>
                               )}
                             </div>
                           ) : (
                             <span className="text-xs text-text-muted italic">Arrastra usuarios aquí</span>
                           )}
                         </div>
                    </div>
                </div>
            </div>
          </header>
        </DroppableProjectZone>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
            <div className="animate-fade-in">
                <ProjectOverview 
                    project={project} 
                    resources={resources}
                    onUpdateProject={fetchProjectData}
                    onUpdateResources={fetchProjectData}
                />
            </div>
        </main>

        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
            <div className={`px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 ${
              toast.type === 'error' ? 'bg-red-900 text-red-200' : 
              toast.type === 'info' ? 'bg-badge-blue text-blue-200' :
              'bg-surface-elevated text-text-primary'
            }`}>
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </div>
        )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={{ duration: 200, easing: 'ease-out' }}>
          {activeId && activeData && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getAvatarColor(activeData.full_name)} text-white font-medium shadow-xl`}>
              <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center font-bold">
                {getInitial(activeData.full_name)}
              </div>
              <span>{activeData.full_name || 'Usuario'}</span>
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
