import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const NOTIFICATION_ICONS = {
  project_assigned: '📋',
  task_assigned: '✅',
  deadline_soon: '⚠️',
  comment: '💬',
  default: '🔔'
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  // Fetch all notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Mark single as read
  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Mark all as read
  const markAllAsRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Delete notification
  const deleteNotification = async (id) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'ahora';
    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays < 7) return `hace ${diffDays} días`;
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Header */}
      <header className="bg-surface-card border-b border-surface-border sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-surface-hover rounded-lg text-text-muted transition">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <Bell size={24} className="text-accent-blue" />
                Notificaciones
              </h1>
              <p className="text-sm text-text-secondary">
                {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todas leídas'}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-accent-blue hover:underline flex items-center gap-1"
            >
              <Check size={14} />
              Marcar todas como leídas
            </button>
          )}
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all' 
                ? 'bg-accent-blue text-white' 
                : 'bg-surface-card text-text-secondary hover:bg-surface-hover'
            }`}
          >
            Todas ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'unread' 
                ? 'bg-accent-blue text-white' 
                : 'bg-surface-card text-text-secondary hover:bg-surface-hover'
            }`}
          >
            Sin leer ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-accent-blue border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-20 bg-surface-card rounded-xl border border-surface-border">
            <Bell size={48} className="mx-auto mb-4 text-text-muted opacity-30" />
            <p className="text-text-muted font-medium">
              {filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
            </p>
          </div>
        ) : (
          <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
            {filteredNotifications.map((notification, idx) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 px-4 py-4 hover:bg-surface-hover transition ${
                  !notification.read ? 'bg-accent-blue/5' : ''
                } ${idx > 0 ? 'border-t border-surface-border' : ''}`}
              >
                {/* Icon */}
                <div className="text-2xl flex-shrink-0 mt-1">
                  {NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.default}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {notification.link ? (
                    <Link 
                      to={notification.link}
                      className="font-semibold text-text-primary hover:text-accent-blue block"
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      {notification.title}
                    </Link>
                  ) : (
                    <p className="font-semibold text-text-primary">{notification.title}</p>
                  )}
                  {notification.message && (
                    <p className="text-sm text-text-secondary mt-1">{notification.message}</p>
                  )}
                  <p className="text-xs text-text-muted mt-2">{formatTime(notification.created_at)}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 hover:bg-surface-secondary rounded-lg text-text-muted hover:text-green-500 transition"
                      title="Marcar como leída"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 hover:bg-surface-secondary rounded-lg text-text-muted hover:text-red-500 transition"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
