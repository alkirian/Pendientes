import { useState, useEffect } from 'react';
import { Users, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function UserSelect({ taskId, assignedUsers = [], onUpdate }) {
  const [allUsers, setAllUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url');
    
    if (error) console.error(error);
    else setAllUsers(data || []);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const isAssigned = (userId) => {
    return assignedUsers.some(u => u.user_id === userId);
  };

  const toggleAssignment = async (userId) => {
    setLoading(true);
    
    if (isAssigned(userId)) {
      // Remove assignment
      const { error } = await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', userId);
      
      if (error) console.error(error);
    } else {
      // Add assignment
      const { error } = await supabase
        .from('task_assignments')
        .insert([{ task_id: taskId, user_id: userId }]);
      
      if (error) console.error(error);
    }
    
    setLoading(false);
    if (onUpdate) onUpdate();
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const assignedProfiles = allUsers.filter(u => isAssigned(u.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <Users size={14} />
          Asignados
        </label>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-blue-500 hover:text-blue-400 text-xs"
        >
          {isOpen ? 'Cerrar' : 'Editar'}
        </button>
      </div>

      {/* Assigned Users Display */}
      <div className="flex flex-wrap gap-2 mb-2">
        {assignedProfiles.length === 0 ? (
          <span className="text-xs text-gray-400 italic">Sin asignar</span>
        ) : (
          assignedProfiles.map(user => (
            <div 
              key={user.id}
              className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs"
            >
              <div className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-[10px] font-bold">
                {getInitial(user.full_name)}
              </div>
              {user.full_name || 'Usuario'}
            </div>
          ))
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 max-h-48 overflow-y-auto">
          {allUsers.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">No hay usuarios</p>
          ) : (
            allUsers.map(user => (
              <button
                key={user.id}
                onClick={() => toggleAssignment(user.id)}
                disabled={loading}
                className={`w-full flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition text-left ${
                  isAssigned(user.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  isAssigned(user.id) 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {isAssigned(user.id) ? <Check size={14} /> : getInitial(user.full_name)}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-200 flex-1">
                  {user.full_name || 'Sin nombre'}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
