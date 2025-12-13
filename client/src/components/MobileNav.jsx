import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Menu, X, Home, Target, Archive, Bell, Settings, LogOut, 
  Sun, Moon, LayoutGrid, Users, List, ChevronRight 
} from 'lucide-react';

export default function MobileNav({ viewMode, setViewMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/focus', label: 'Mi Enfoque', icon: Target },
    { path: '/archive', label: 'Archivo', icon: Archive },
    { path: '/notifications', label: 'Notificaciones', icon: Bell },
    { path: '/settings', label: 'Configuración', icon: Settings },
  ];

  const viewOptions = [
    { id: 'grid', label: 'Prioridad', icon: LayoutGrid },
    { id: 'people', label: 'Personas', icon: Users },
    { id: 'list', label: 'Lista', icon: List },
  ];

  const handleViewChange = (view) => {
    setViewMode(view);
    localStorage.setItem('dashboard-view-mode', view);
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <>
      {/* Hamburger Button - Only visible on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2 rounded-lg bg-surface-secondary hover:bg-surface-hover text-text-primary transition"
        aria-label="Abrir menú"
      >
        <Menu size={24} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div className={`
        fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-surface-card z-50 
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:hidden border-r border-surface-border
        flex flex-col
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name || 'Avatar'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent-blue flex items-center justify-center text-white font-bold">
                {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <p className="font-medium text-text-primary">
                {profile?.full_name || 'Usuario'}
              </p>
              <p className="text-xs text-text-muted truncate max-w-[180px]">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-surface-hover text-text-muted"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-accent-blue text-white' 
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                    }
                  `}
                >
                  <Icon size={20} />
                  {item.label}
                  {isActive && <ChevronRight size={16} className="ml-auto" />}
                </Link>
              );
            })}
          </div>

          {/* View Mode Selector - Only show on Dashboard */}
          {location.pathname === '/' && viewMode && setViewMode && (
            <div className="mt-6 pt-4 border-t border-surface-border">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3 px-2">
                Vista
              </p>
              <div className="space-y-1">
                {viewOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = viewMode === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleViewChange(option.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                        ${isActive 
                          ? 'bg-surface-secondary text-accent-blue' 
                          : 'text-text-secondary hover:bg-surface-hover'
                        }
                      `}
                    >
                      <Icon size={18} />
                      {option.label}
                      {isActive && <span className="ml-auto text-accent-blue">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Theme Toggle */}
          <div className="mt-6 pt-4 border-t border-surface-border">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-hover transition-all"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            </button>
          </div>
        </nav>

        {/* Footer - Logout */}
        <div className="p-4 border-t border-surface-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}
