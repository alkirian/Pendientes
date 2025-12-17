import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  X, Trash2, Clock, Users, Link as LinkIcon, 
  FileText, Check, Pencil, Plus, ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { calculateAutoPriority } from '../../utils/priorityUtils';

// Inline Editable Field
function EditableField({ value, onSave, type = 'text', className = '', placeholder = '' }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditValue(value || '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        autoFocus
        className={`bg-surface-secondary border border-accent-blue rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-accent-blue ${className}`}
      />
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

// Main Modal Component - Simplified (no tabs, no metrics, no status)
export default function ProjectDetailModal({ isOpen, onClose, project, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [toast, setToast] = useState(null);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [newResource, setNewResource] = useState({ title: '', url: '' });
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  
  // Editable fields
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('');
  const [description, setDescription] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    return colors[name ? name.charCodeAt(0) % colors.length : 0];
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  const fetchData = useCallback(async () => {
    if (!project?.id) return;

    const { data: resourcesData } = await supabase
      .from('project_resources')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });
    setResources(resourcesData || []);

    const { data: usersData } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url');
    setAvailableUsers(usersData || []);
  }, [project?.id]);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setClient(project.client || '');
      setDeadline(project.deadline?.split('T')[0] || '');
      setPriority(project.priority || 'medium');
      setDescription(project.description || '');
      fetchData();
    }
  }, [project, fetchData]);

  const updateField = async (field, value) => {
    const { error } = await supabase
      .from('projects')
      .update({ [field]: value })
      .eq('id', project.id);
    
    if (error) {
      showToast('Error al guardar', 'error');
    } else {
      showToast('Guardado ✓');
      onUpdate();
    }
  };

  const handleSaveAll = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('projects')
      .update({ 
        name, 
        client, 
        deadline: deadline || null, 
        priority,
        description 
      })
      .eq('id', project.id);

    setLoading(false);
    if (error) {
      showToast('Error al guardar', 'error');
    } else {
      showToast('Proyecto actualizado ✓');
      onUpdate();
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este proyecto?')) return;
    setLoading(true);
    const { error } = await supabase.from('projects').delete().eq('id', project.id);
    setLoading(false);
    if (error) {
      showToast('Error al eliminar', 'error');
    } else {
      onUpdate();
      onClose();
    }
  };

  const handleComplete = async () => {
    if (!confirm('¿Marcar este proyecto como completado?')) return;
    setLoading(true);
    const { error } = await supabase
      .from('projects')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', project.id);
    setLoading(false);
    if (error) {
      showToast('Error al completar', 'error');
    } else {
      showToast('Proyecto completado ✓');
      onUpdate();
      onClose();
    }
  };

  const handleAddMember = async (user) => {
    const { error } = await supabase
      .from('project_members')
      .insert([{ project_id: project.id, user_id: user.id }]);
    
    if (!error) {
      showToast(`${user.full_name} agregado al equipo ✓`);
      onUpdate();
    } else {
      showToast('Error al agregar miembro', 'error');
    }
    setShowUserPicker(false);
  };

  const handleRemoveMember = async (userId, userName) => {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', project.id)
      .eq('user_id', userId);
    
    if (!error) {
      showToast(`${userName || 'Usuario'} removido del equipo`);
      onUpdate();
    } else {
      showToast('Error al remover miembro', 'error');
    }
  };

  // Resources helpers
  const getResourceIcon = (type) => {
    switch (type) {
      case 'design': return <span className="text-purple-500">🎨</span>;
      case 'doc': return <span className="text-blue-500">📄</span>;
      case 'video': return <span className="text-red-500">🎬</span>;
      default: return <LinkIcon size={16} className="text-text-muted" />;
    }
  };

  const detectResourceType = (url) => {
    if (url.includes('figma.com')) return 'design';
    if (url.includes('docs.google.com') || url.includes('notion.so')) return 'doc';
    if (url.includes('youtube.com') || url.includes('vimeo.com')) return 'video';
    return 'link';
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    const type = detectResourceType(newResource.url);
    const finalUrl = newResource.url.match(/^https?:\/\//i) ? newResource.url : 'https://' + newResource.url;

    const { error } = await supabase
      .from('project_resources')
      .insert([{
        project_id: project.id,
        title: newResource.title,
        url: finalUrl,
        type: type
      }]);

    if (!error) {
      setNewResource({ title: '', url: '' });
      setShowAddResource(false);
      fetchData();
      showToast('Recurso agregado ✓');
    }
  };

  const handleDeleteResource = async (id) => {
    const { error } = await supabase
      .from('project_resources')
      .delete()
      .eq('id', id);
    
    if (!error) {
      fetchData();
      showToast('Recurso eliminado');
    }
  };

  if (!project) return null;

  const effectivePriority = calculateAutoPriority(deadline, priority);
  const members = project.project_members || [];
  
  const priorityConfig = {
    low: { label: 'Baja', bg: 'bg-emerald-500/20 text-emerald-400', icon: '🟢' },
    medium: { label: 'Media', bg: 'bg-amber-500/20 text-amber-400', icon: '🟡' },
    high: { label: 'Alta', bg: 'bg-red-500/20 text-red-400', icon: '🔴' },
  };

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
          <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
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
            <Dialog.Panel className="w-full max-w-2xl bg-surface-card rounded-2xl shadow-2xl transition-all my-8 border border-surface-border">
              {/* Header */}
              <div className="p-6 border-b border-surface-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 mr-4">
                    <EditableField 
                      value={name} 
                      onSave={(val) => { setName(val); updateField('name', val); }}
                      className="text-2xl font-bold text-text-primary"
                      placeholder="Nombre del proyecto"
                    />
                  </div>
                  <button 
                    onClick={onClose} 
                    className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text-primary transition"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Meta Row - Priority + Client + Deadline */}
                <div className="flex items-center gap-4 text-sm text-text-secondary flex-wrap">
                  {/* Priority - Custom Dropdown */}
                  <div className="relative group">
                    <button
                      type="button"
                      className={`text-xs px-3 py-1.5 rounded-full font-medium cursor-pointer flex items-center gap-1.5 transition-all ${priorityConfig[effectivePriority]?.bg} hover:opacity-80`}
                    >
                      <span>{priorityConfig[effectivePriority]?.icon}</span>
                      <span>{priorityConfig[effectivePriority]?.label}</span>
                      <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {/* Dropdown Menu */}
                    <div className="absolute left-0 top-full mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 bg-surface-elevated border border-surface-border rounded-lg shadow-xl py-1 min-w-[120px]">
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => { setPriority(key); updateField('priority', key); }}
                          className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                            priority === key 
                              ? 'bg-surface-hover text-text-primary' 
                              : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                          }`}
                        >
                          <span>{config.icon}</span>
                          <span>{config.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">Cliente:</span>
                    <EditableField 
                      value={client} 
                      onSave={(val) => { setClient(val); updateField('client', val); }}
                      placeholder="Sin cliente"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-text-muted" />
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => { setDeadline(e.target.value); updateField('deadline', e.target.value); }}
                      className="bg-transparent border-0 text-text-secondary hover:text-text-primary cursor-pointer text-sm p-0"
                    />
                  </div>
                </div>
              </div>

              {/* Content - All in one scroll */}
              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-6">
                
                {/* Brief Section */}
                <div className="bg-surface-secondary rounded-xl p-5 border border-surface-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-text-primary flex items-center gap-2">
                      <FileText size={16} className="text-text-muted" />
                      Brief del Proyecto
                    </h4>
                    {!isEditingBrief ? (
                      <button 
                        onClick={() => setIsEditingBrief(true)}
                        className="p-1.5 hover:bg-surface-hover rounded-lg text-text-muted hover:text-accent-blue transition"
                      >
                        <Pencil size={16} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => { updateField('description', description); setIsEditingBrief(false); }}
                        className="p-1.5 hover:bg-green-500/10 rounded-lg text-green-500 transition"
                      >
                        <Check size={18} />
                      </button>
                    )}
                  </div>

                  {isEditingBrief ? (
                    <textarea
                      className="w-full h-32 px-3 py-2 rounded-lg border border-surface-border bg-surface-card focus:ring-2 focus:ring-accent-blue text-sm leading-relaxed resize-none"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe el objetivo y alcance del proyecto..."
                      autoFocus
                    />
                  ) : (
                    <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-line min-h-[60px]">
                      {description || <span className="text-text-muted italic">Sin descripción. Click en editar para agregar una.</span>}
                    </div>
                  )}
                </div>

                {/* Team Section */}
                <div className="bg-surface-secondary rounded-xl p-5 border border-surface-border">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-text-primary flex items-center gap-2">
                      <Users size={16} className="text-text-muted" />
                      Equipo ({members.length})
                    </h4>
                    <button
                      onClick={() => setShowUserPicker(!showUserPicker)}
                      className="flex items-center gap-1 text-sm text-accent-blue hover:text-blue-400 transition"
                    >
                      <Plus size={16} /> Agregar
                    </button>
                  </div>

                  {/* User Picker */}
                  {showUserPicker && (
                    <div className="bg-surface-card border border-surface-border rounded-lg p-3 mb-4 animate-fade-in">
                      <p className="text-xs text-text-muted mb-2">Selecciona un usuario:</p>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {availableUsers
                          .filter(u => !members.find(m => m.user_id === u.id))
                          .map(user => (
                            <button
                              key={user.id}
                              onClick={() => handleAddMember(user)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-surface-secondary hover:bg-surface-hover rounded-full text-sm transition"
                            >
                              <div className={`w-5 h-5 rounded-full ${getAvatarColor(user.full_name)} flex items-center justify-center text-white text-[10px] font-bold`}>
                                {getInitial(user.full_name)}
                              </div>
                              {user.full_name}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Members */}
                  {members.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {members.map((member) => (
                        <div
                          key={member.user_id}
                          className="flex items-center gap-2 px-3 py-2 bg-surface-card rounded-full border border-surface-border group"
                        >
                          {member.profiles?.avatar_url ? (
                            <img 
                              src={member.profiles.avatar_url} 
                              alt={member.profiles.full_name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className={`w-6 h-6 rounded-full ${getAvatarColor(member.profiles?.full_name)} flex items-center justify-center text-white text-xs font-bold`}>
                              {getInitial(member.profiles?.full_name)}
                            </div>
                          )}
                          <span className="text-sm text-text-primary">
                            {member.profiles?.full_name || 'Usuario'}
                          </span>
                          <button
                            onClick={() => handleRemoveMember(member.user_id, member.profiles?.full_name)}
                            className="p-0.5 text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted italic">Sin miembros asignados</p>
                  )}
                </div>

                {/* Resources Section */}
                {(resources.length > 0 || showAddResource) && (
                  <div className="bg-surface-secondary rounded-xl p-5 border border-surface-border">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-text-primary flex items-center gap-2">
                        <LinkIcon size={16} className="text-text-muted" />
                        Recursos ({resources.length})
                      </h4>
                      <button
                        onClick={() => setShowAddResource(!showAddResource)}
                        className="flex items-center gap-1 text-sm text-accent-blue hover:text-blue-400 transition"
                      >
                        <Plus size={16} /> Agregar
                      </button>
                    </div>

                    {/* Add Resource Form */}
                    {showAddResource && (
                      <form onSubmit={handleAddResource} className="bg-surface-card border border-surface-border rounded-lg p-3 mb-4 animate-fade-in">
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Título (ej: Guión, Figma)"
                            className="w-full px-3 py-2 rounded-lg border border-surface-border bg-surface-secondary text-sm focus:ring-2 focus:ring-accent-blue"
                            value={newResource.title}
                            onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                            required
                            autoFocus
                          />
                          <input
                            type="text"
                            placeholder="URL (https://...)"
                            className="w-full px-3 py-2 rounded-lg border border-surface-border bg-surface-secondary text-sm focus:ring-2 focus:ring-accent-blue"
                            value={newResource.url}
                            onChange={(e) => setNewResource({...newResource, url: e.target.value})}
                            required
                          />
                          <div className="flex gap-2 justify-end">
                            <button 
                              type="button" 
                              onClick={() => setShowAddResource(false)}
                              className="px-3 py-1.5 text-sm text-text-muted hover:text-text-secondary"
                            >
                              Cancelar
                            </button>
                            <button 
                              type="submit" 
                              className="px-3 py-1.5 text-sm bg-accent-blue text-white rounded-lg hover:bg-blue-600"
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {/* Resources List */}
                    <div className="space-y-2">
                      {resources.map(resource => (
                        <div 
                          key={resource.id} 
                          className="flex items-center justify-between p-3 bg-surface-card rounded-lg border border-surface-border hover:border-accent-blue/50 transition group"
                        >
                          <a 
                            href={resource.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 flex-1 min-w-0"
                          >
                            <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center shrink-0">
                              {getResourceIcon(resource.type)}
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent-blue transition">
                                {resource.title}
                              </p>
                              <p className="text-xs text-text-muted truncate flex items-center gap-1">
                                {new URL(resource.url).hostname} <ExternalLink size={10} />
                              </p>
                            </div>
                          </a>
                          <button 
                            onClick={() => handleDeleteResource(resource.id)}
                            className="p-1.5 text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Resource Button if no resources */}
                {resources.length === 0 && !showAddResource && (
                  <button
                    onClick={() => setShowAddResource(true)}
                    className="w-full p-4 border-2 border-dashed border-surface-border rounded-xl text-text-muted hover:border-accent-blue hover:text-accent-blue transition flex items-center justify-center gap-2"
                  >
                    <LinkIcon size={18} />
                    <span>Agregar enlace</span>
                  </button>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-surface-border">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition text-sm"
                  >
                    <Trash2 size={16} />
                    Eliminar
                  </button>
                  <button
                    onClick={handleComplete}
                    className="flex items-center gap-2 px-4 py-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition text-sm"
                  >
                    <Check size={16} />
                    Completar
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-text-secondary hover:bg-surface-hover rounded-lg transition"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={handleSaveAll}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2 bg-accent-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition font-medium"
                  >
                    <CheckCircle2 size={16} />
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>

              {/* Toast */}
              {toast && (
                <div className="absolute bottom-20 right-6 animate-fade-in">
                  <div className={`px-4 py-2 rounded-lg shadow-lg ${
                    toast.type === 'error' ? 'bg-red-900 text-red-200' : 'bg-surface-elevated text-text-primary'
                  }`}>
                    <span className="text-sm font-medium">{toast.message}</span>
                  </div>
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
