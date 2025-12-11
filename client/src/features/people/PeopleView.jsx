import { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { supabase } from '../../lib/supabase';
import ProjectCard from '../projects/ProjectCard';
import { ChevronDown, ChevronRight, Search, Filter, Minimize2, Maximize2 } from 'lucide-react';
import { calculateAutoPriority } from '../../utils/priorityUtils';

export default function PeopleView({ projects, onQuickAction, isUserDragging }) {
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUsers, setExpandedUsers] = useState({}); // Track individual expansions
  const [allExpanded, setAllExpanded] = useState(true); // Global state

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name');
    
    if (error) console.error(error);
    else setAllUsers(data || []);
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);

  // Group projects by assigned members
  const groupProjectsByPerson = () => {
    const grouped = {};
    const unassigned = [];

    // Initialize groups for all users
    allUsers.forEach(user => {
      grouped[user.id] = {
        user,
        projects: []
      };
    });

    // Distribute projects
    projects.forEach(project => {
      const members = project.project_members || [];
      
      if (members.length === 0) {
        unassigned.push(project);
      } else {
        members.forEach(member => {
          if (grouped[member.user_id]) {
            grouped[member.user_id].projects.push(project);
          }
        });
      }
    });

    return { grouped, unassigned };
  };

  const { grouped, unassigned } = groupProjectsByPerson();
  
  // Sort projects by priority (high -> medium -> low)
  const sortByPriority = (projects) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return [...projects].sort((a, b) => {
      const aEffective = calculateAutoPriority(a.deadline, a.priority);
      const bEffective = calculateAutoPriority(b.deadline, b.priority);
      return priorityOrder[aEffective] - priorityOrder[bEffective];
    });
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    return colors[name ? name.charCodeAt(0) % colors.length : 0];
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  // Droppable component for person columns


  // Droppable component for person rows (Horizontal Layout)
  function DroppablePersonRow({ userId, user, userProjects, isExpanded, onToggle }) {
    const { setNodeRef, isOver } = useDroppable({
      id: `person-${userId}`,
      data: { type: 'person-drop', userId }
    });

    return (
      <div ref={setNodeRef} className={`group flex flex-col md:flex-row items-start gap-4 p-4 rounded-xl transition-all border ${
         isOver 
           ? 'bg-blue-50 border-accent-blue ring-2 ring-accent-blue' 
           : 'bg-surface-card border-surface-border hover:border-gray-300 shadow-sm'
      }`}>
        {/* User Header (Collapsible Trigger) */}
        <div 
          className="w-full md:w-48 flex-shrink-0 flex items-center gap-3 sticky top-0 cursor-pointer select-none"
          onClick={onToggle}
        >
             <button className="p-1 hover:bg-surface-hover rounded-full text-text-muted transition-colors">
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
             </button>
             <div className={`w-10 h-10 rounded-full ${getAvatarColor(user.full_name)} flex items-center justify-center text-white font-bold shadow-sm relative`}>
               {getInitial(user.full_name)}
               {/* Workload Counter Bubble */}
               <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-surface-card ${
                 userProjects.length > 5 ? 'bg-accent-red text-white' : 
                 userProjects.length > 2 ? 'bg-accent-yellow text-white' : 'bg-gray-200 text-gray-600'
               }`}>
                 {userProjects.length}
               </div>
             </div>
             <div className="overflow-hidden">
               <h3 className="font-bold text-text-primary truncate text-sm" title={user.full_name}>{user.full_name}</h3>
               <p className="text-xs text-text-secondary truncate">{userProjects.length} tarea{userProjects.length !== 1 ? 's' : ''}</p>
             </div>
        </div>

        {/* Projects Area (Collapsible) */}
        {isExpanded && (
          <div className="flex-1 w-full animate-in fade-in slide-in-from-top-2 duration-200">
             {userProjects.length > 0 ? (
               <div className="flex flex-wrap gap-3">
                 {sortByPriority(userProjects).map(project => (
                    <div key={`${userId}-${project.id}`} className="w-full md:w-72"> 
                       <ProjectCard
                         uniqueId={`${userId}-${project.id}`}
                         project={project}
                         onQuickAction={onQuickAction}
                         isUserDragging={isUserDragging}
                       />
                    </div>
                 ))}
               </div>
             ) : (
               <div className="w-full h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-text-muted text-sm italic">
                  Arrastra proyectos aquí para asignar
               </div>
             )}
          </div>
        )}
      </div>
    );
  }

  // Droppable component for unassigned column (Vertical Layout)
  function DroppableUnassignedColumn({ projects }) {
    const { setNodeRef, isOver } = useDroppable({
      id: 'unassigned-column',
      data: { type: 'person-drop', userId: 'unassigned' }
    });

    return (
      <div ref={setNodeRef} className="flex-shrink-0 w-80 lg:w-96 flex flex-col h-full bg-surface-secondary border-r border-surface-border">
        <div className="p-4 border-b border-surface-border bg-surface-card sticky top-0 z-10">
          <div className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
            isOver 
              ? 'bg-gray-100 border-gray-400 ring-2 ring-gray-400' 
              : 'bg-surface-elevated border-surface-border'
          }`}>
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
              ?
            </div>
            <div>
              <h3 className="font-bold text-text-primary">Sin Asignar</h3>
              <p className="text-sm text-text-secondary">{projects.length} proyecto{projects.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {projects.length > 0 ? (
            sortByPriority(projects).map(project => (
              <ProjectCard
                key={`unassigned-${project.id}`}
                uniqueId={`unassigned-${project.id}`}
                project={project}
                onQuickAction={onQuickAction}
                isUserDragging={isUserDragging}
              />
            ))
           ) : (
             <div className="h-48 border-2 border-dashed border-gray-200 rounded-xl flex flex-col gap-2 items-center justify-center text-text-muted text-sm">
               <span>📥</span>
               <span>Arrastra aquí para desasignar</span>
             </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-surface-card rounded-xl border border-surface-border">
      {/* 1. Left Panel: Unassigned (Fixed Width) */}
      <DroppableUnassignedColumn projects={unassigned} />

      {/* 2. Right Panel: User Rows (Scrollable) */}
      <div className="flex-1 h-full overflow-y-auto bg-surface-primary">
        <div className="p-6 space-y-4 pb-20">
          
          {/* Header & Search */}
          <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-1">Equipo ({Object.keys(grouped).length})</h2>
              
              {/* Expand/Collapse All Buttons */}
              <div className="flex items-center gap-1 bg-surface-secondary rounded-lg p-0.5 border border-surface-border">
                <button
                  onClick={() => {
                    const allUserIds = Object.keys(grouped);
                    const newExpanded = {};
                    allUserIds.forEach(id => { newExpanded[id] = true; });
                    setExpandedUsers(newExpanded);
                    setAllExpanded(true);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                    allExpanded 
                      ? 'bg-accent-blue text-white' 
                      : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                  title="Expandir todos"
                >
                  <Maximize2 size={12} />
                  <span className="hidden sm:inline">Expandir</span>
                </button>
                <button
                  onClick={() => {
                    const allUserIds = Object.keys(grouped);
                    const newCollapsed = {};
                    allUserIds.forEach(id => { newCollapsed[id] = false; });
                    setExpandedUsers(newCollapsed);
                    setAllExpanded(false);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                    !allExpanded 
                      ? 'bg-accent-blue text-white' 
                      : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                  title="Contraer todos"
                >
                  <Minimize2 size={12} />
                  <span className="hidden sm:inline">Contraer</span>
                </button>
              </div>
            </div>
            
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                placeholder="Buscar proyecto o persona..." 
                className="pl-9 pr-4 py-1.5 text-sm bg-white text-text-primary border border-surface-border rounded-full focus:ring-2 focus:ring-accent-blue focus:border-transparent outline-none w-64 transition-all placeholder:text-text-muted"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {Object.values(grouped)
            .filter(({ user, projects }) => {
               if (!searchTerm) return true;
               const term = searchTerm.toLowerCase();
               // Match User Name 
               if (user.full_name?.toLowerCase().includes(term)) return true;
               // Match Project Name
               return projects.some(p => p.name.toLowerCase().includes(term));
            })
            .map(({ user, projects: userProjects }) => {
              // Filter projects inside the user row if search term is active
              const filteredProjects = searchTerm 
                  ? userProjects.filter(p => 
                      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                  : userProjects;

              return (
                <DroppablePersonRow
                  key={user.id}
                  userId={user.id}
                  user={user}
                  userProjects={filteredProjects}
                  isExpanded={expandedUsers[user.id] !== false}
                  onToggle={() => {
                    setExpandedUsers(prev => ({
                      ...prev,
                      [user.id]: prev[user.id] === false ? true : false
                    }));
                  }}
                />
              );
            })
          }

          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-10 text-obsidian-500">
              No hay usuarios encontrados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
