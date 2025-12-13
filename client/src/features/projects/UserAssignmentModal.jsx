import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Search, Check, Users } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function UserAssignmentModal({ isOpen, onClose, projectId, currentMembers, onSave }) {
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      // Initialize selected users from current members
      const memberIds = new Set((currentMembers || []).map(m => m.user_id));
      setSelectedUserIds(memberIds);
    }
  }, [isOpen, currentMembers]);

  const fetchUsers = async () => {
    setLoading(true);
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

  const toggleUser = (userId) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Get users to add (in selected but not in current)
      // 2. Get users to remove (in current but not in selected)
      // Ideally, simpler approach: replace all members for this project
      // But let's follow the established pattern of efficient updates locally if possible
      
      // For simplicity and robustness, we'll sync the selection
      // But we need to call the parent handler to confirm
      
      const selectedArray = Array.from(selectedUserIds);
      await onSave(projectId, selectedArray);
      onClose();
    } catch (error) {
      console.error('Error saving assignments:', error);
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    return colors[name ? name.charCodeAt(0) % colors.length : 0];
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full sm:max-w-md transform overflow-hidden rounded-t-2xl sm:rounded-2xl bg-surface-card text-left align-middle shadow-xl transition-all flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-primary">
                  <Dialog.Title as="h3" className="text-lg font-bold text-text-primary flex items-center gap-2">
                    <Users size={20} className="text-accent-blue" />
                    Asignar Equipo
                  </Dialog.Title>
                  <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-hover text-text-secondary">
                    <X size={20} />
                  </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-surface-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input
                      type="text"
                      className="w-full pl-9 pr-4 py-2 bg-surface-secondary border border-surface-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent-blue"
                      placeholder="Buscar personas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto p-2">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-text-muted text-sm">
                      No se encontraron usuarios
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredUsers.map((user) => {
                        const isSelected = selectedUserIds.has(user.id);
                        return (
                          <div
                            key={user.id}
                            onClick={() => toggleUser(user.id)}
                            className={`
                              flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border
                              ${isSelected 
                                ? 'bg-accent-blue/10 border-accent-blue' 
                                : 'bg-transparent border-transparent hover:bg-surface-hover'
                              }
                            `}
                          >
                            <div className="relative">
                              {user.avatar_url ? (
                                <img 
                                  src={user.avatar_url} 
                                  alt={user.full_name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className={`w-10 h-10 rounded-full ${getAvatarColor(user.full_name)} flex items-center justify-center text-white font-bold`}>
                                  {getInitial(user.full_name)}
                                </div>
                              )}
                              {isSelected && (
                                <div className="absolute -bottom-1 -right-1 bg-accent-blue text-white rounded-full p-0.5 border-2 border-surface-card">
                                  <Check size={10} strokeWidth={4} />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${isSelected ? 'text-accent-blue' : 'text-text-primary'}`}>
                                {user.full_name}
                              </p>
                              <p className="text-xs text-text-secondary truncate">
                                {user.default_role || 'Miembro'}
                              </p>
                            </div>

                            <div className={`
                              w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                              ${isSelected 
                                ? 'bg-accent-blue border-accent-blue' 
                                : 'border-surface-border'
                              }
                            `}>
                              {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-surface-border bg-surface-primary safe-area-bottom">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3 bg-accent-blue hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? 'Guardando...' : `Confirmar (${selectedUserIds.size})`}
                  </button>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
