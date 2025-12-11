import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Check, Search, UserPlus } from 'lucide-react';

export default function UserAssignModal({ isOpen, onClose, task, onUpdate }) {
  const [allUsers, setAllUsers] = useState([]);
  const [assignedUserIds, setAssignedUserIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && task) {
      fetchData();
    }
  }, [isOpen, task]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch all users
    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .order('full_name');
    
    setAllUsers(users || []);

    // Fetch current assignments
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('user_id')
      .eq('task_id', task.id);
    
    setAssignedUserIds((assignments || []).map(a => a.user_id));
    setLoading(false);
  };

  const toggleUser = async (userId) => {
    const isCurrentlyAssigned = assignedUserIds.includes(userId);

    if (isCurrentlyAssigned) {
      // Remove
      const { error } = await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', task.id)
        .eq('user_id', userId);
      
      if (!error) {
        setAssignedUserIds(prev => prev.filter(id => id !== userId));
      }
    } else {
      // Add
      const { error } = await supabase
        .from('task_assignments')
        .insert([{ task_id: task.id, user_id: userId }]);
      
      if (!error) {
        setAssignedUserIds(prev => [...prev, userId]);
      }
    }
  };

  const handleClose = () => {
    if (onUpdate) onUpdate();
    onClose();
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';
  
  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    return colors[name ? name.charCodeAt(0) % colors.length : 0];
  };

  const filteredUsers = allUsers.filter(user => 
    (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!task) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <UserPlus size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <Dialog.Title className="font-semibold text-gray-900 dark:text-white">
                      Asignar Responsables
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                      {task.title}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar usuarios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Users List */}
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron usuarios
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredUsers.map(user => {
                      const isAssigned = assignedUserIds.includes(user.id);
                      return (
                        <button
                          key={user.id}
                          onClick={() => toggleUser(user.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                            isAssigned 
                              ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full ${getAvatarColor(user.full_name)} flex items-center justify-center text-white font-bold`}>
                            {getInitial(user.full_name)}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.full_name || 'Sin nombre'}
                            </p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                            isAssigned 
                              ? 'bg-blue-500 border-blue-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isAssigned && <Check size={14} className="text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {assignedUserIds.length} usuario(s) asignado(s)
                </span>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Listo
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
