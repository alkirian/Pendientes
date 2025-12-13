import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Camera, Save, User, AlertTriangle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ROLE_OPTIONS = [
  { value: 'editor', label: 'Editor' },
  { value: 'postproduccion', label: 'Postproducción' },
  { value: 'director', label: 'Director' },
  { value: 'productor', label: 'Productor' },
  { value: 'camarografo', label: 'Camarógrafo' },
  { value: 'sonidista', label: 'Sonidista' },
  { value: 'miembro', label: 'Miembro' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [fullName, setFullName] = useState('');
  const [defaultRole, setDefaultRole] = useState('miembro');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, default_role')
      .eq('id', user.id)
      .single();

    if (data && !error) {
      setFullName(data.full_name || '');
      setDefaultRole(data.default_role || 'miembro');
      setAvatarUrl(data.avatar_url);
    }
    setLoading(false);
  };

  // Compress image using canvas
  const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Por favor selecciona una imagen.' });
        return;
      }
      
      setMessage({ type: 'info', text: 'Procesando imagen...' });
      
      try {
        // Compress the image automatically
        const compressedFile = await compressImage(file);
        
        setAvatarFile(compressedFile);
        setAvatarPreview(URL.createObjectURL(compressedFile));
        setMessage({ type: '', text: '' });
      } catch (error) {
        console.error('Error compressing image:', error);
        setMessage({ type: 'error', text: 'Error al procesar la imagen.' });
      }
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return avatarUrl;

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Upload avatar if changed
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar();
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          default_role: defaultRole,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
      setMessage({ type: 'success', text: '¡Perfil actualizado correctamente!' });
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: 'Error al guardar. Intenta de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue"></div>
      </div>
    );
  }

const DangerZone = () => {
    const { logout, deleteAccount } = useAuth();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
  
    const handleDelete = async () => {
      if (confirmText !== 'confirmar') return;
      
      setIsDeleting(true);
      setDeleteError(null);
      try {
        await deleteAccount();
        // Redirect handled by logout/provider
      } catch (error) {
        console.error(error);
        setDeleteError('Error al eliminar cuenta. Verifica tu conexión o intenta más tarde.');
        setIsDeleting(false);
      }
    };
  
    return (
      <div className="mt-8 pt-8 border-t border-surface-border">
        <h2 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
          <AlertTriangle size={20} />
          Zona de Peligro
        </h2>
  
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-lg border border-surface-border">
            <div>
              <h3 className="font-medium text-text-primary">Cerrar Sesión</h3>
              <p className="text-sm text-text-muted">Cierra tu sesión actual en este dispositivo.</p>
            </div>
            <button 
              type="button"
              onClick={logout}
              className="px-4 py-2 bg-surface-card border border-surface-border hover:bg-surface-hover text-text-primary rounded-lg transition-colors flex items-center gap-2 font-medium"
            >
              <LogOut size={16} />
              Cerrar Sesión
            </button>
          </div>
  
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/30">
            <div>
              <h3 className="font-medium text-red-700 dark:text-red-400">Eliminar Cuenta</h3>
              <p className="text-sm text-red-600/80 dark:text-red-400/80">
                Esta acción es permanente. Se eliminarán todos tus datos y asignaciones.
              </p>
            </div>
            <button 
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
            >
              Eliminar Cuenta
            </button>
          </div>
        </div>
  
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface-card w-full max-w-md rounded-2xl p-6 shadow-xl border border-surface-border animate-scale-in">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                 <AlertTriangle size={32} />
                 <h3 className="text-xl font-bold">¿Eliminar cuenta?</h3>
              </div>
              
              <p className="text-text-secondary mb-6 leading-relaxed">
                Estás a punto de eliminar tu cuenta permanentemente. Esta acción 
                <span className="font-bold text-text-primary"> no se puede deshacer</span>.
                Se prohibirá tu acceso y se eliminarán tus datos personales.
              </p>
  
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Escribe <span className="font-mono font-bold select-all bg-surface-secondary px-1 rounded">confirmar</span> para continuar:
                </label>
                <input 
                  type="text" 
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-elevated border-2 border-surface-border focus:border-red-500 rounded-lg outline-none transition-colors"
                  placeholder="confirmar"
                  autoFocus
                />
              </div>
  
              {deleteError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {deleteError}
                </div>
              )}
  
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => { setShowDeleteModal(false); setConfirmText(''); setDeleteError(null); }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-text-secondary hover:bg-surface-hover rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={confirmText !== 'confirmar' || isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {isDeleting ? 'Eliminando...' : 'Sí, eliminar permanentemente'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-surface-primary pb-20">
      {/* Header */}
      <header className="bg-surface-card border-b border-surface-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-text-primary"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-text-primary">Configuración de Perfil</h1>
        </div>
      </header>
  
      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-surface-card rounded-xl shadow-sm border border-surface-border overflow-hidden">
        {/* ... existing form content ... */}
          {/* Avatar Section */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-8 flex flex-col items-center">
            <div className="relative group">
              <div 
                className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold overflow-hidden border-4 border-white/30 shadow-xl cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {(avatarPreview || avatarUrl) ? (
                  <img 
                    src={avatarPreview || avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(fullName)
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-surface-card rounded-full shadow-lg text-text-primary hover:bg-surface-hover transition-colors"
              >
                <Camera size={18} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-white/80 text-sm mt-3">Haz clic para cambiar tu foto</p>
          </div>
  
          {/* Form Fields */}
          <div className="p-6 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre completo"
                className="w-full px-4 py-2.5 border border-surface-border rounded-lg bg-surface-elevated focus:ring-2 focus:ring-accent-blue focus:border-accent-blue outline-none transition-colors text-text-primary"
              />
            </div>
  
            {/* Default Role */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Rol por Defecto
              </label>
              <select
                value={defaultRole}
                onChange={(e) => setDefaultRole(e.target.value)}
                className="w-full px-4 py-2.5 border border-surface-border rounded-lg bg-surface-elevated focus:ring-2 focus:ring-accent-blue focus:border-accent-blue outline-none transition-colors text-text-primary"
              >
                {ROLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-text-muted mt-1">
                Este rol se sugerirá cuando te agreguen a un proyecto.
              </p>
            </div>
  
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2.5 border border-surface-border rounded-lg bg-surface-primary text-text-muted cursor-not-allowed"
              />
              <p className="text-xs text-text-muted mt-1">
                El email no se puede cambiar.
              </p>
            </div>
  
            {/* Message */}
            {message.text && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === 'success' 
                ? 'bg-green-900/30 text-green-400 border border-green-700/50' 
                : 'bg-red-900/30 text-red-400 border border-red-700/50'
              }`}>
                {message.text}
              </div>
            )}
  
            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
  
        {/* Usando component wrapper para evitar nesting issues, aunque conceptualmente está bien */}
        <DangerZone />
      </main>
    </div>
  );
}
