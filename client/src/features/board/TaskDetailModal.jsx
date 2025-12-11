import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Trash2, MessageSquare, Info } from 'lucide-react';
import LinkInput from '../../components/LinkInput';
import UserSelect from '../../components/UserSelect';
import TaskActivityFeed from './TaskActivityFeed';

export default function TaskDetailModal({ isOpen, onClose, task, onUpdate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [deadline, setDeadline] = useState('');
  const [links, setLinks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'activity'

  const fetchTaskData = useCallback(async () => {
    if (!task?.id) return;

    // Fetch links
    const { data: linksData } = await supabase
      .from('task_links')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: false });
    setLinks(linksData || []);

    // Fetch assignments
    const { data: assignData } = await supabase
      .from('task_assignments')
      .select('user_id')
      .eq('task_id', task.id);
    setAssignments(assignData || []);
  }, [task?.id]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setDeadline(task.deadline || '');
      fetchTaskData();
    }
  }, [task, fetchTaskData]);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('tasks')
      .update({ title, description, status, priority, deadline: deadline || null })
      .eq('id', task.id);

    setLoading(false);
    if (error) {
      console.error(error);
      alert('Error updating task');
    } else {
      onUpdate();
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;
    setLoading(true);
    const { error } = await supabase.from('tasks').delete().eq('id', task.id);
    setLoading(false);
    if (error) {
      console.error(error);
      alert('Error deleting task');
    } else {
      onUpdate();
      onClose();
    }
  };

  if (!task) return null;

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
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
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
            <Dialog.Panel className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl transition-all my-8">
              <div className="flex justify-between items-start mb-6">
                <div className="w-full mr-4">
                    <input 
                        type="text" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)}
                        className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full text-gray-900 dark:text-white"
                    />
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-500"><X size={24} /></button>
              </div>

              <div className="flex border-b border-gray-100 dark:border-gray-700 mb-6">
                <button
                    onClick={() => setActiveTab('details')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'details' 
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <Info size={16} /> Detalles
                </button>
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'activity' 
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <MessageSquare size={16} /> Actividad
                </button>
              </div>

              {activeTab === 'details' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                      {/* Description */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                          <textarea 
                              value={description} 
                              onChange={e => setDescription(e.target.value)} 
                              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]" 
                              placeholder="Añadir descripción..."
                          />
                      </div>
                      
                      {/* Links Section */}
                      <LinkInput 
                        taskId={task.id} 
                        links={links} 
                        onUpdate={fetchTaskData} 
                      />
                  </div>

                  <div className="space-y-4">
                      {/* Assignees */}
                      <UserSelect 
                        taskId={task.id} 
                        assignedUsers={assignments} 
                        onUpdate={fetchTaskData} 
                      />

                      {/* Status */}
                      <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Estado</label>
                          <select 
                            value={status} 
                            onChange={e => setStatus(e.target.value)}
                            className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white"
                          >
                              <option value="pending">Pendiente</option>
                              <option value="in_progress">En Curso</option>
                              <option value="review">Revisión</option>
                              <option value="approved">Aprobado</option>
                              <option value="delivered">Entregado</option>
                          </select>
                      </div>

                      {/* Priority */}
                      <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Prioridad</label>
                          <select 
                            value={priority} 
                            onChange={e => setPriority(e.target.value)}
                            className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white"
                          >
                                <option value="low">Baja</option>
                                <option value="medium">Media</option>
                                <option value="high">Alta</option>
                                <option value="critical">Crítica</option>
                          </select>
                      </div>

                       {/* Deadline */}
                       <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Deadline</label>
                          <input 
                            type="date" 
                            value={deadline} 
                            onChange={e => setDeadline(e.target.value)}
                            className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white"
                          />
                      </div>

                      {/* Delete */}
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <button 
                            onClick={handleDelete}
                            className="w-full flex items-center justify-center gap-2 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition text-sm"
                          >
                              <Trash2 size={16} /> Eliminar Tarea
                          </button>
                      </div>
                  </div>
              </div>
              ) : (
                <TaskActivityFeed taskId={task.id} />
              )}

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">Cancelar</button>
                  <button 
                    onClick={handleSave} 
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
