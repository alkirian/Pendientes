import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, User } from 'lucide-react';

export default function TaskActivityFeed({ taskId }) {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchActivities = async () => {
    const { data: acts, error: activitiesError } = await supabase
      .from('task_activities')
      .select(`
        *,
        user:profiles!user_id(full_name)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (!activitiesError) {
        setActivities(acts);
    }
  };

  useEffect(() => {
    fetchActivities();

    // Realtime subscription
    const channel = supabase
      .channel('activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_activities',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
           // Optimistically fetch or push? Fetch is safer for joined data (profile)
           fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('task_activities')
      .insert([
        { task_id: taskId, user_id: user.id, content: input, type: 'comment' }
      ]);
      
    if (!error) {
      setInput('');
      // Optimistic update could happen here but subscription handles it
    }
    setLoading(false);
  };

  const getInitials = (name) => name ? name.substring(0,2).toUpperCase() : 'U';

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 custom-scrollbar">
        {activities.length === 0 ? (
            <div className="text-center text-gray-400 py-10 text-sm italic">
                No hay actividad aún. Sé el primero en comentar.
            </div>
        ) : (
             activities.map(act => (
                <div key={act.id} className={`flex gap-3 ${act.user_id === user.id ? 'justify-end' : 'justify-start'}`}>
                    {/* Avatar (only for others) */}
                    {act.user_id !== user.id && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300 shrink-0">
                             {getInitials(act.user?.full_name)}
                        </div>
                    )}
                    
                    <div className={`max-w-[80%] rounded-xl p-3 text-sm ${
                        act.type === 'system' 
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 text-center w-full !max-w-full text-xs italic'
                        : act.user_id === user.id 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
                    }`}>
                        {act.type !== 'system' && (
                             <p className="font-bold text-xs mb-1 opacity-80">
                                {act.user?.full_name || 'Desconocido'}
                             </p>
                        )}
                        <p>{act.content}</p>
                        <p className="text-[10px] mt-1 opacity-70 text-right">
                             {formatDistanceToNow(new Date(act.created_at), { addSuffix: true, locale: es })}
                        </p>
                    </div>
                </div>
             ))
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="relative mt-auto">
        <input
            type="text"
            placeholder="Escribe un comentario..."
            className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-900 dark:text-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
        />
        <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg disabled:opacity-50 transition-colors"
        >
            <Send size={18} />
        </button>
      </form>
    </div>
  );
}
