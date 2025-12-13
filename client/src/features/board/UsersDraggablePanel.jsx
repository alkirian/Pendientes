import { useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { supabase } from '../../lib/supabase';
import { Users, GripVertical } from 'lucide-react';

const ROLE_LABELS = {
  'editor': 'Editor',
  'postproduccion': 'Postproducción',
  'director': 'Director',
  'productor': 'Productor',
  'camarografo': 'Camarógrafo',
  'sonidista': 'Sonidista',
  'miembro': 'Miembro',
};

function DraggableUser({ user }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `user-${user.id}`,
    data: { type: 'user', user }
  });

    /* const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
  } : undefined; */

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';
  
  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500'
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  return (
    <div
      ref={setNodeRef}
      /* style={style}  <-- Removing transform to prevent overflow issues. Overlay handles the visual drag. */
      {...listeners}
      {...attributes}
      className={`
        flex items-center gap-3 p-2 rounded-lg cursor-grab active:cursor-grabbing
        bg-surface-elevated border border-surface-border
        hover:border-accent-blue transition-all
        ${isDragging ? 'scale-105 opacity-90 border-accent-blue' : ''}
      `}
    >
      <GripVertical size={14} className="text-text-muted" />
      {user.avatar_url ? (
        <img 
          src={user.avatar_url} 
          alt={user.full_name}
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className={`w-8 h-8 rounded-full ${getAvatarColor(user.full_name)} flex items-center justify-center text-white font-bold text-sm`}>
          {getInitial(user.full_name)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {user.full_name || 'Sin nombre'}
        </p>
        <p className="text-xs text-text-secondary truncate">
          {ROLE_LABELS[user.default_role] || 'Miembro'}
        </p>
      </div>
    </div>
  );
}

export default function UsersDraggablePanel({ isUserDragging, onDragStart, onDragEnd }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, default_role')
        .order('full_name');
      
      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="bg-surface-card rounded-xl border border-surface-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-text-muted" />
          <span className="font-semibold text-text-primary">Equipo</span>
        </div>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-surface-elevated rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-surface-card rounded-xl border border-surface-border transition-all ${isCollapsed ? 'p-2' : 'p-4'}`}>
      {/* Header */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <Users size={18} className="text-accent-blue" />
          <span className="font-semibold text-text-primary">Equipo</span>
          <span className="text-xs bg-surface-elevated text-text-secondary px-2 py-0.5 rounded-full">
            {users.length}
          </span>
        </div>
        <svg 
          className={`w-4 h-4 text-text-muted transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Users List */}
      {!isCollapsed && (
        <>
          <p className="text-xs text-text-muted mb-3">
            Arrastra un usuario sobre un proyecto para asignarlo
          </p>
          
          <div className="space-y-2">
            {users.length === 0 ? (
              <div className="text-center py-4 text-text-muted text-sm">
                No hay usuarios registrados
              </div>
            ) : (
              users.map(user => (
                <DraggableUser key={user.id} user={user} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
