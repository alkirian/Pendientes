import { useEffect, useState, useCallback } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { LogOut, Plus, Briefcase, Target, Users as UsersIcon, List, LayoutGrid, Settings, Archive, Users } from 'lucide-react';
import MobileNav from '../components/MobileNav';
import ProjectCard from '../features/projects/ProjectCard';
import CreateProjectModal from '../features/projects/CreateProjectModal';
import UserAssignmentModal from '../features/projects/UserAssignmentModal';
import UsersDraggablePanel from '../features/board/UsersDraggablePanel';
import PeopleView from '../features/people/PeopleView';
import ListView from '../features/list/ListView';
import PriorityGridView from '../features/grid/PriorityGridView';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';

const PROJECT_COLUMNS = [
  { id: 'pending', title: 'Pendientes' },
  { id: 'active', title: 'En Curso' },
  { id: 'completed', title: 'Completados' },
];

export default function DashboardPage() {
  const { user, profile, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [projectToAssign, setProjectToAssign] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [toast, setToast] = useState(null); // { message, type }
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('dashboard-view-mode') || 'grid';
  });
  
  // Drag state
  const [activeId, setActiveId] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [activeData, setActiveData] = useState(null);
  
  // Mobile state
  const [showMobileUsers, setShowMobileUsers] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Auto-hide toast
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProjects = useCallback(async () => {
    console.log('Fetching projects...');
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        tasks (id, status),
        project_members (
          user_id,
          profiles (full_name, avatar_url)
        )
      `)
      .neq('status', 'completed') // Exclude completed projects
      .order('created_at', { ascending: false });
    
    console.log('Projects fetched:', data);
    if (error) console.error('Projects error:', error);
    
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
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Quick Actions Handler
  const handleQuickAction = async (projectId, action, value) => {
    switch (action) {
      case 'delete':
        if (confirm('¿Estás seguro de eliminar este proyecto? Se eliminarán todas sus tareas y asignaciones.')) {
          try {
            // 1. Delete tasks
            await supabase.from('tasks').delete().eq('project_id', projectId);
            
            // 2. Delete project members
            await supabase.from('project_members').delete().eq('project_id', projectId);

            // 3. Delete project
            const { error } = await supabase.from('projects').delete().eq('id', projectId);
            
            if (error) throw error;
            
            // Update local state immediately
            setProjects(prev => prev.filter(p => p.id !== projectId));
            
            showToast('✅ Proyecto eliminado correctamente', 'success');
            // Background fetch to ensure sync
            fetchProjects();
          } catch (error) {
            console.error('Error deleting project:', error);
            showToast('❌ Error al eliminar el proyecto', 'error');
          }
        }
        break;
      
      case 'status':
        try {
          const { error } = await supabase.from('projects').update({ status: value }).eq('id', projectId);
          if (error) throw error;
          fetchProjects();
        } catch (error) {
          console.error('Error updating status:', error);
          showToast('❌ Error al actualizar estado', 'error');
        }
        break;
      
      case 'edit': {
        const projectToEdit = projects.find(p => p.id === projectId);
        if (projectToEdit) {
          setEditingProject(projectToEdit);
          setShowModal(true);
        }
        break;
      }

      case 'update_note':
        try {
          const { error } = await supabase
            .from('projects')
            .update({ quick_note: value })
            .eq('id', projectId);
            
          if (error) throw error;
          
          // Optimistic local update to avoid full refetch flicker
          setProjects(prev => prev.map(p => 
            p.id === projectId ? { ...p, quick_note: value } : p
          ));
          
        } catch (error) {
          console.error('Error updating note:', error);
          showToast('❌ Error al guardar la nota', 'error');
        }
        break;

      case 'update_priority':
        try {
          // Optimistic local update
          setProjects(prev => prev.map(p => 
            p.id === projectId ? { ...p, priority: value } : p
          ));

          const { error } = await supabase
            .from('projects')
            .update({ priority: value })
            .eq('id', projectId);
            
          if (error) {
            throw error;
          }
          showToast('✅ Prioridad actualizada');
        } catch (error) {
          console.error('Error updating priority:', error);
          showToast('❌ Error al actualizar prioridad', 'error');
          fetchProjects(); // Revert
        }
        break;
      
      case 'assign':
        {
          const project = projects.find(p => p.id === projectId);
          if (project) {
            setProjectToAssign(project);
            setShowAssignmentModal(true);
          }
        }
        break;

      case 'complete':
        try {
          const projectName = projects.find(p => p.id === projectId)?.name || 'Proyecto';
          
          // Update project to completed status with timestamp
          const { error } = await supabase
            .from('projects')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', projectId);
            
          if (error) throw error;
          
          showToast(`✅ "${projectName}" marcado como completado`);
          fetchProjects(); // Refresh to remove from active view
        } catch (error) {
          console.error('Error completing project:', error);
          showToast('❌ Error al completar proyecto', 'error');
        }
        break;
      
      default:
        break;
    }
  };

  // Handle Team Assignment from Modal
  const handleAssignMembers = async (projectId, selectedUserIds) => {
    try {
      // 1. Remove existing members
      const { error: deleteError } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId);
        
      if (deleteError) throw deleteError;

      // 2. Insert new members
      if (selectedUserIds.length > 0) {
        const toInsert = selectedUserIds.map(userId => ({
          project_id: projectId,
          user_id: userId
        }));
        
        const { error: insertError } = await supabase
          .from('project_members')
          .insert(toInsert);
          
        if (insertError) throw insertError;
      }
      
      showToast('✅ Equipo actualizado correctamente');
      fetchProjects();
    } catch (error) {
      console.error('Error assigning members:', error);
      showToast('❌ Error al asignar miembros', 'error');
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    if (active.data.current?.type === 'user') {
      setActiveType('user');
      setActiveData(active.data.current.user);
    } else if (active.data.current?.type === 'project') {
      setActiveType('project');
      setActiveData(active.data.current.project);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!over) {
      resetDragState();
      return;
    }

    // Handle project drag to person column (team reassignment - single owner enforcement)
    if (activeType === 'project') {
      const dropData = over.data.current;
      
      // Handle drop to priority section (change priority)
      if (dropData?.type === 'priority-drop') {
        const dragData = active.data.current;
        const projectId = dragData.project.id;
        const newPriority = dropData.priority; // 'high', 'medium', or 'low'
        
        try {
          // Update project priority in database
          const { error } = await supabase
            .from('projects')
            .update({ priority: newPriority })
            .eq('id', projectId);
            
          if (error) throw error;
          
          const priorityLabels = { high: 'Urgente', medium: 'En Progreso', low: 'Normal' };
          showToast(`✅ Prioridad cambiada a "${priorityLabels[newPriority]}"`);
          fetchProjects();
        } catch (error) {
          console.error('Error updating priority:', error);
          showToast('❌ Error al cambiar prioridad', 'error');
        }
      }
      // Handle drop to person column
      else if (dropData?.type === 'person-drop') {
        const dragData = active.data.current;
        const projectId = dragData.project.id;
        const userId = dropData.userId; // 'unassigned' or actual UUID
        
        try {
          // 1. Remove ALL existing members (enforce single owner rule)
          const { error: deleteError } = await supabase
            .from('project_members')
            .delete()
            .eq('project_id', projectId);
            
          if (deleteError) throw deleteError;

          // 2. If dropping on a specific user (not unassigned), add them
          if (userId !== 'unassigned') {
            const { error: insertError } = await supabase
              .from('project_members')
              .insert([{ project_id: projectId, user_id: userId }]);
              
            if (insertError) throw insertError;
            showToast('✅ Proyecto reasignado correctamente');
          } else {
            showToast('✅ Proyecto movido a Sin Asignar');
          }

          fetchProjects();
        } catch (error) {
          console.error('Error reassigning project:', error);
          showToast('❌ Error al reasignar proyecto', 'error');
        }
      }
    }
    // Handle user drop on project (add to team)
    else if (activeType === 'user') {
      const userId = active.data.current.user.id;
      const userName = active.data.current.user.full_name || 'Usuario';
      const dropData = over.data.current;
      
      if (dropData?.type === 'project-drop') {
        const projectId = dropData.projectId;
        const projectTitle = projects.find(p => p.id === projectId)?.name || 'el proyecto';

        // Insert into project_members
        const { error } = await supabase
          .from('project_members')
          .upsert([{ project_id: projectId, user_id: userId }], { onConflict: 'project_id,user_id' });
        
        if (!error) {
           showToast(`✅ ${userName} agregado al equipo de "${projectTitle}"`);
           fetchProjects();
        } else {
           console.error('Error assigning team member:', error);
           showToast('❌ Error al asignar usuario al equipo', 'error');
        }
      }
    }
    
    resetDragState();
  };

  const resetDragState = () => {
    setActiveId(null);
    setActiveType(null);
    setActiveData(null);
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    return colors[name ? name.charCodeAt(0) % colors.length : 0];
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
      onDragCancel={resetDragState}
    >
      <div className="min-h-screen bg-surface-primary flex flex-col">
        {/* Header */}
        <header className="bg-surface-card border-b border-surface-border sticky top-0 z-20">
          <div className="px-4 lg:px-6 py-3 lg:py-4 flex justify-between items-center">
            {/* Left Section - Menu + Logo */}
            <div className="flex items-center gap-3">
              {/* Mobile Nav */}
              <MobileNav viewMode={viewMode} setViewMode={setViewMode} />
              
              {/* Logo */}
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-accent-blue rounded-xl flex items-center justify-center">
                  <Briefcase size={18} className="text-white lg:hidden" />
                  <Briefcase size={20} className="text-white hidden lg:block" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg lg:text-xl font-bold text-text-primary">
                    Pendientes
                  </h1>
                  <p className="text-xs text-text-secondary hidden lg:block">
                    Gestión de proyectos
                  </p>
                </div>
              </div>
            </div>
            
            {/* Center Section - Desktop Nav (hidden on mobile) */}
            <div className="hidden lg:flex items-center gap-4">
              <a 
                href="/focus"
                className="flex items-center gap-2 text-text-secondary hover:text-accent-blue font-medium px-3 py-2 rounded-lg hover:bg-surface-hover transition"
              >
                <Target size={20} />
                Mi Enfoque
              </a>

              <a 
                href="/archive"
                className="flex items-center gap-2 text-text-secondary hover:text-emerald-400 font-medium px-3 py-2 rounded-lg hover:bg-surface-hover transition"
              >
                <Archive size={20} />
                Archivo
              </a>

              {/* View Mode Toggle - Desktop */}
              <div className="flex items-center bg-surface-secondary rounded-lg p-1 border border-surface-border">
                <button
                  onClick={() => {
                    setViewMode('grid');
                    localStorage.setItem('dashboard-view-mode', 'grid');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'grid'
                      ? 'bg-accent-blue text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                  title="Vista Grid por Prioridad"
                >
                  <LayoutGrid size={16} />
                  <span className="hidden xl:inline">Prioridad</span>
                </button>
                <button
                  onClick={() => {
                    setViewMode('people');
                    localStorage.setItem('dashboard-view-mode', 'people');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'people'
                      ? 'bg-accent-blue text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                  title="Vista por Personas"
                >
                  <UsersIcon size={16} />
                  <span className="hidden xl:inline">Personas</span>
                </button>
                <button
                  onClick={() => {
                    setViewMode('list');
                    localStorage.setItem('dashboard-view-mode', 'list');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'list'
                      ? 'bg-accent-blue text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                  title="Vista Lista Compacta"
                >
                  <List size={16} />
                  <span className="hidden xl:inline">Lista</span>
                </button>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Mobile Users Toggle */}
              <button
                onClick={() => setShowMobileUsers(!showMobileUsers)}
                className={`lg:hidden p-2 rounded-lg transition ${
                  showMobileUsers 
                    ? 'bg-accent-blue text-white' 
                    : 'bg-surface-secondary text-text-secondary hover:bg-surface-hover'
                }`}
                title="Ver usuarios"
              >
                <Users size={20} />
              </button>

              {/* New Project Button */}
              <button 
                onClick={() => {
                  setEditingProject(null);
                  setShowModal(true);
                }}
                className="bg-accent-blue hover:bg-blue-700 text-white px-3 lg:px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Nuevo</span>
              </button>
              
              {/* Desktop-only controls */}
              <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-surface-border">
                <a 
                  href="/settings" 
                  className="w-9 h-9 rounded-full overflow-hidden hover:ring-2 hover:ring-accent-blue transition-all"
                  title="Configuración de Perfil"
                >
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name || 'Avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-badge-blue text-badgeText-blue flex items-center justify-center font-bold">
                      {profile?.full_name ? profile.full_name[0] : (user?.email ? user.email[0].toUpperCase() : 'U')}
                    </div>
                  )}
                </a>
                <NotificationBell />
                <ThemeToggle />
                <a
                  href="/settings"
                  className="p-2 hover:bg-surface-hover rounded-lg text-text-muted transition"
                  title="Configuración"
                >
                  <Settings size={20} />
                </a>
                <button 
                  onClick={logout}
                  className="p-2 hover:bg-surface-hover rounded-lg text-text-muted transition"
                  title="Cerrar Sesión"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Mobile Users Panel - Slide-down */}
          {showMobileUsers && (
            <div className="lg:hidden border-b border-surface-border bg-surface-secondary p-4 animate-fade-in max-h-64 overflow-y-auto">
              <UsersDraggablePanel />
            </div>
          )}

          {/* Users Panel (Left Sidebar - Desktop) */}
          <aside className="w-72 p-4 border-r border-surface-border bg-surface-secondary overflow-y-auto hidden lg:block flex-shrink-0">
            <UsersDraggablePanel />
          </aside>

          {/* Main View */}
          <main className="flex-1 overflow-x-auto overflow-y-auto p-4 lg:p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-blue"></div>
              </div>
            ) : viewMode === 'list' ? (
              <ListView projects={projects} onQuickAction={handleQuickAction} isUserDragging={activeType === 'user'} />
            ) : viewMode === 'people' ? (
              <PeopleView projects={projects} onQuickAction={handleQuickAction} isUserDragging={activeType === 'user'} />
            ) : (
              <PriorityGridView 
                projects={projects} 
                onQuickAction={handleQuickAction} 
                isUserDragging={activeType === 'user'} 
                isProjectDragging={activeType === 'project'}
              />
            )}
          </main>
        </div>

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={{ duration: 200, easing: 'ease-out' }}>
          {activeId && activeType === 'project' && activeData && (
            <div className="rotate-2 scale-105 w-80 lg:w-96">
              <ProjectCard project={activeData} disableDrag={true} />
            </div>
          )}
          
          {activeId && activeType === 'user' && activeData && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getAvatarColor(activeData.full_name)} text-white font-medium`}>
              <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center font-bold">
                {getInitial(activeData.full_name)}
              </div>
              <span>{activeData.full_name || 'Usuario'}</span>
            </div>
          )}
        </DragOverlay>

        {/* Create Project Modal */}
        <CreateProjectModal 
          isOpen={showModal} 
          onClose={() => { setShowModal(false); setEditingProject(null); }} 
          onCreated={fetchProjects} 
          projectToEdit={editingProject}
        />

        {/* User Assignment Modal */}
        <UserAssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => { setShowAssignmentModal(false); setProjectToAssign(null); }}
          projectId={projectToAssign?.id}
          currentMembers={projectToAssign?.project_members}
          onSave={handleAssignMembers}
        />

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 animate-fade-in`}>
            <div className={`px-5 py-3 rounded-xl flex items-center gap-3 ${
              toast.type === 'error' ? 'bg-red-900 text-red-200' : 
              toast.type === 'info' ? 'bg-badge-blue text-blue-200' :
              'bg-surface-elevated text-obsidian-200'
            }`}>
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
}
