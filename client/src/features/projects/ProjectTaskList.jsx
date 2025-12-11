import { Calendar, User as UserIcon, CheckCircle2, Circle, Clock } from 'lucide-react';

export default function ProjectTaskList({ tasks, onTaskClick }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={18} className="text-green-500" />;
      case 'active': return <Clock size={18} className="text-blue-500" />;
      case 'delivered': return <CheckCircle2 size={18} className="text-purple-500" />;
      default: return <Circle size={18} className="text-gray-400" />;
    }
  };

  const priorityConfig = {
    low: { label: 'Baja', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
    medium: { label: 'Media', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    high: { label: 'Alta', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
    urgent: { label: 'Urgente', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    return colors[name ? name.charCodeAt(0) % colors.length : 0];
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          Tareas ({tasks.length})
        </h3>
        {/* Filter buttons could go here */}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th className="px-6 py-3 font-medium w-12">Estado</th>
              <th className="px-6 py-3 font-medium">Tarea</th>
              <th className="px-6 py-3 font-medium">Asignado a</th>
              <th className="px-6 py-3 font-medium">Prioridad</th>
              <th className="px-6 py-3 font-medium">Fecha límite</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {tasks.length > 0 ? (
              tasks.map(task => (
                <tr 
                  key={task.id} 
                  onClick={() => onTaskClick(task)}
                  className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div title={task.status}>
                      {getStatusIcon(task.status)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{task.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {task.assignments && task.assignments.length > 0 ? (
                      <div className="flex -space-x-2">
                        {task.assignments.map((assignee, idx) => (
                           <div 
                             key={assignee.user_id || idx}
                             className={`w-7 h-7 rounded-full ${getAvatarColor(assignee.profiles?.full_name)} border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}
                             title={assignee.profiles?.full_name}
                           >
                             {getInitial(assignee.profiles?.full_name)}
                           </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm flex items-center gap-1">
                        <UserIcon size={14} /> <span className="text-xs">Sin asignar</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityConfig[task.priority]?.color || priorityConfig.medium.color}`}>
                      {priorityConfig[task.priority]?.label || task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {task.deadline ? (
                      <div className={`flex items-center gap-1.5 text-sm ${new Date(task.deadline) < new Date() ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                        <Calendar size={14} />
                        <span>{new Date(task.deadline).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center">
                    <CheckCircle2 size={32} className="mb-2 opacity-20" />
                    <p>No hay tareas en este proyecto.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
