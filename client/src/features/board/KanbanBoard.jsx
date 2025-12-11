import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import { supabase } from '../../lib/supabase';

const COLUMNS = [
  { id: 'pending', title: 'Pendiente' },
  { id: 'in_progress', title: 'En Curso' },
  { id: 'review', title: 'Revisión' },
  { id: 'approved', title: 'Aprobado' },
  { id: 'delivered', title: 'Entregado' },
];

export default function KanbanBoard({ projectId, tasks: initialTasks, onTaskUpdate, onTaskClick, onQuickAction }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState(null);
  const [activeType, setActiveType] = useState(null); // 'task' or 'user'
  const [activeData, setActiveData] = useState(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    // Determine what type of item is being dragged
    if (active.data.current?.type === 'user') {
      setActiveType('user');
      setActiveData(active.data.current.user);
    } else {
      setActiveType('task');
      setActiveData(tasks.find(t => t.id === active.id));
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setActiveType(null);
      setActiveData(null);
      return;
    }

    // Handle user drop on task
    if (activeType === 'user') {
      const userId = active.data.current.user.id;
      const dropData = over.data.current;
      
      // Check if dropped on a task
      if (dropData?.type === 'task-drop') {
        const taskId = dropData.taskId;
        
        // Assign user to task
        const { error } = await supabase
          .from('task_assignments')
          .upsert([{ task_id: taskId, user_id: userId }], { onConflict: 'task_id,user_id' });
        
        if (error) {
          console.error('Error assigning user:', error);
        } else {
          if (onTaskUpdate) onTaskUpdate();
        }
      }
    } 
    // Handle task drag between columns
    else {
      const activeTask = tasks.find(t => t.id === active.id);
      const newStatus = over.id;

      // Only update if dropped on a column (not on another task)
      if (activeTask && COLUMNS.some(col => col.id === newStatus) && activeTask.status !== newStatus) {
        // Optimistic update
        const updatedTasks = tasks.map(t => 
          t.id === active.id ? { ...t, status: newStatus } : t
        );
        setTasks(updatedTasks);

        // API Call
        const { error } = await supabase
          .from('tasks')
          .update({ status: newStatus })
          .eq('id', active.id);
        
        if (error) {
          console.error('Error updating task status:', error);
          // Revert on error
          setTasks(initialTasks);
        } else {
          if (onTaskUpdate) onTaskUpdate();
        }
      }
    }
    
    setActiveId(null);
    setActiveType(null);
    setActiveData(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setActiveType(null);
    setActiveData(null);
  };

  // Get avatar color for user overlay
  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full gap-6 overflow-x-auto pb-4 items-start">
        {COLUMNS.map(col => (
          <KanbanColumn 
            key={col.id} 
            id={col.id} 
            title={col.title} 
            tasks={tasks.filter(t => t.status === col.id)} 
            onTaskClick={onTaskClick}
            onQuickAction={onQuickAction}
            isUserDragging={activeType === 'user'}
          />
        ))}
      </div>

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'ease-out',
      }}>
        {activeId && activeType === 'task' && activeData ? (
          <div className="rotate-3 scale-105">
            <TaskCard task={activeData} />
          </div>
        ) : null}
        
        {activeId && activeType === 'user' && activeData ? (
          <div className={`
            flex items-center gap-2 px-4 py-2 rounded-full shadow-2xl
            ${getAvatarColor(activeData.full_name)} text-white font-medium
          `}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
              {getInitial(activeData.full_name)}
            </div>
            <span>{activeData.full_name || 'Usuario'}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
