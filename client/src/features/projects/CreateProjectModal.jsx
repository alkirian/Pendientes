import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Search, UserPlus, Users, ChevronDown } from 'lucide-react';

// Roles disponibles para miembros del proyecto
const ROLE_OPTIONS = [
  { value: 'editor', label: 'Editor' },
  { value: 'postproduccion', label: 'Postproducción' },
  { value: 'director', label: 'Director' },
  { value: 'productor', label: 'Productor' },
  { value: 'camarografo', label: 'Camarógrafo' },
  { value: 'sonidista', label: 'Sonidista' },
  { value: 'miembro', label: 'Miembro' },
];

export default function CreateProjectModal({ isOpen, onClose, onCreated, projectToEdit = null }) {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);

  // Team selection state
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name || '');
      setClient(projectToEdit.client || '');
      setDescription(projectToEdit.description || '');
      setDeadline(projectToEdit.deadline || '');
      setPriority(projectToEdit.priority === 'auto' ? 'medium' : (projectToEdit.priority || 'medium'));
      // Load existing members if editing
      loadExistingMembers(projectToEdit.id);
    } else {
      setName('');
      setClient('');
      setDescription('');
      setDeadline('');
      setPriority('medium');
      setSelectedMembers([]);
    }
  }, [projectToEdit, isOpen]);

  const loadExistingMembers = async (projectId) => {
    const { data } = await supabase
      .from('project_members')
      .select('user_id, role, profiles:user_id(id, full_name, avatar_url)')
      .eq('project_id', projectId);
    
    if (data) {
      setSelectedMembers(data.map(m => ({
        ...m.profiles,
        role: m.role || 'miembro'
      })));
    }
  };

  const searchProfiles = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .ilike('full_name', `%${query}%`)
      .limit(5);
    
    // Filter out already selected members
    const filtered = (data || []).filter(
      p => !selectedMembers.some(m => m.id === p.id)
    );
    setSearchResults(filtered);
  }, [selectedMembers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchProfiles(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchProfiles]);

  const addMember = (profile) => {
    setSelectedMembers(prev => [...prev, { ...profile, role: 'miembro' }]);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const updateMemberRole = (profileId, newRole) => {
    setSelectedMembers(prev => prev.map(m => 
      m.id === profileId ? { ...m, role: newRole } : m
    ));
  };

  const removeMember = (profileId) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== profileId));
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let projectId;

      if (projectToEdit) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update({ name, client, description, deadline: deadline || null, priority })
          .eq('id', projectToEdit.id);
        
        if (error) throw error;
        projectId = projectToEdit.id;

        // Update members: delete existing, insert new
        await supabase.from('project_members').delete().eq('project_id', projectId);
      } else {
        // Create new project
        const { data, error } = await supabase
          .from('projects')
          .insert([{ name, client, description, deadline: deadline || null, priority }])
          .select('id')
          .single();
        
        if (error) throw error;
        projectId = data.id;
      }

      // Insert selected members with roles
      if (selectedMembers.length > 0) {
        const membersToInsert = selectedMembers.map(m => ({
          project_id: projectId,
          user_id: m.id,
          role: m.role || 'miembro'
        }));
        
        const { error: membersError } = await supabase
          .from('project_members')
          .insert(membersToInsert);
        
        if (membersError) console.error('Error adding members:', membersError);
      }

      onCreated();
      onClose();
    } catch (error) {
      console.error(error);
      alert(projectToEdit ? 'Error al actualizar proyecto' : 'Error al crear proyecto');
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!projectToEdit;

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
          <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
           <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-lg bg-surface-card rounded-xl p-6 shadow-xl border border-surface-border transition-all my-8">
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title className="text-xl font-bold text-text-primary">
                  {isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                </Dialog.Title>
                <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary">Nombre del Proyecto</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 p-2 border border-surface-border rounded bg-surface-elevated text-text-primary focus:ring-2 focus:ring-accent-blue outline-none placeholder:text-text-muted" placeholder="Video Corporativo X" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary">Cliente</label>
                  <input required type="text" value={client} onChange={e => setClient(e.target.value)} className="w-full mt-1 p-2 border border-surface-border rounded bg-surface-elevated text-text-primary focus:ring-2 focus:ring-accent-blue outline-none placeholder:text-text-muted" placeholder="Empresa Y" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary">Descripción</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-1 p-2 border border-surface-border rounded bg-surface-elevated text-text-primary focus:ring-2 focus:ring-accent-blue outline-none placeholder:text-text-muted" rows={2} placeholder="Detalles del proyecto..." />
                </div>

                {/* Team Selection Section */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                    <Users size={16} /> Equipo del Proyecto
                  </label>
                  
                  {/* Selected Members with Role Dropdown */}
                  {selectedMembers.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {selectedMembers.map(member => (
                        <div 
                          key={member.id}
                          className="flex items-center gap-3 bg-surface-elevated border border-surface-border px-3 py-2 rounded-lg"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {getInitials(member.full_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{member.full_name}</p>
                          </div>
                          <select
                            value={member.role || 'miembro'}
                            onChange={(e) => updateMemberRole(member.id, e.target.value)}
                            className="text-xs px-2 py-1 border border-surface-border rounded-md bg-surface-card text-text-secondary focus:ring-2 focus:ring-accent-blue outline-none cursor-pointer"
                          >
                            {ROLE_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <button 
                            type="button"
                            onClick={() => removeMember(member.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Search Input */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Buscar usuarios para agregar..."
                      className="w-full pl-10 pr-4 py-2 border border-surface-border rounded-lg bg-surface-elevated text-text-primary focus:ring-2 focus:ring-accent-blue focus:bg-surface-card outline-none text-sm transition-colors"
                    />

                    {/* Dropdown Results */}
                    {showDropdown && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-surface-card border border-surface-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {searchResults.map(profile => (
                          <button
                            key={profile.id}
                            type="button"
                            onClick={() => addMember(profile)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                              {getInitials(profile.full_name)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text-primary">{profile.full_name}</p>
                            </div>
                            <UserPlus size={16} className="ml-auto text-blue-500" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedMembers.length === 0 && (
                    <p className="text-xs text-text-muted mt-2 italic">
                      💡 Los miembros seleccionados podrán ver y colaborar en este proyecto.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary">Fecha de Entrega</label>
                    <input 
                      type="date" 
                      value={deadline} 
                      onChange={e => setDeadline(e.target.value)} 
                      className="w-full mt-1 p-2 border border-surface-border rounded bg-surface-elevated text-text-primary focus:ring-2 focus:ring-accent-blue outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary">Prioridad</label>
                    <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full mt-1 p-2 border border-surface-border rounded bg-surface-elevated text-text-primary focus:ring-2 focus:ring-accent-blue outline-none">
                      <option value="low">🟢 Baja</option>
                      <option value="medium">🟡 Media</option>
                      <option value="high">🔴 Alta</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-border">
                  <button type="button" onClick={onClose} className="px-4 py-2 text-text-secondary hover:bg-surface-hover rounded-lg transition">Cancelar</button>
                  <button type="submit" disabled={loading} className="px-5 py-2 bg-accent-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
                    {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Proyecto')}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

