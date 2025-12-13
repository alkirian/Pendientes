import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Camera } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'editor', label: 'Editor' },
  { value: 'postproduccion', label: 'Postproducción' },
  { value: 'director', label: 'Director' },
  { value: 'productor', label: 'Productor' },
  { value: 'camarografo', label: 'Camarógrafo' },
  { value: 'sonidista', label: 'Sonidista' },
  { value: 'miembro', label: 'Miembro del equipo' },
];

export default function CompleteProfilePage() {
  const { user, needsProfileCompletion, updateProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [displayName, setDisplayName] = useState('');
  const [defaultRole, setDefaultRole] = useState('miembro');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If profile is already complete, redirect to dashboard
  useEffect(() => {
    if (!needsProfileCompletion) {
      navigate('/');
    }
  }, [needsProfileCompletion, navigate]);

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
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona una imagen.');
        return;
      }
      
      try {
        const compressedFile = await compressImage(file);
        setAvatarFile(compressedFile);
        setAvatarPreview(URL.createObjectURL(compressedFile));
        setError('');
      } catch (err) {
        console.error('Error compressing image:', err);
        setError('Error al procesar la imagen.');
      }
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return null;

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Por favor ingresa tu nombre');
      return;
    }

    if (displayName.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload avatar if selected
      let avatarUrl = null;
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      // Update profile with all fields
      const profileUpdates = {
        full_name: displayName.trim(),
        default_role: defaultRole,
      };
      
      if (avatarUrl) {
        profileUpdates.avatar_url = avatarUrl;
      }

      await updateProfile(profileUpdates);
      // updateProfile will refresh the profile and needsProfileCompletion will become false
      // The useEffect above will then redirect to dashboard
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-surface-card rounded-xl shadow-lg border border-surface-border">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-primary">¡Completa tu perfil!</h2>
          <p className="text-text-secondary mt-2">
            Configura cómo te verán los demás en el equipo
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <div 
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden border-4 border-surface-border shadow-lg">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(displayName)
                )}
              </div>
              <div className="absolute bottom-0 right-0 p-2 bg-accent-blue rounded-full shadow-lg text-white hover:bg-blue-700 transition-colors">
                <Camera size={16} />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-text-muted mt-2">Toca para subir foto (opcional)</p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Tu nombre *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-3 bg-surface-elevated border border-surface-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent-blue focus:outline-none transition placeholder:text-text-muted"
              placeholder="Ej: Juan Pérez"
              autoFocus
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Tu rol principal
            </label>
            <select
              value={defaultRole}
              onChange={(e) => setDefaultRole(e.target.value)}
              className="w-full p-3 bg-surface-elevated border border-surface-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent-blue focus:outline-none transition"
            >
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1">
              Este rol se sugerirá cuando te agreguen a proyectos
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !displayName.trim()}
            className="w-full py-3 px-4 bg-accent-blue text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 transition disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Comenzar a usar Pendientes'}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-surface-border">
          <p className="text-sm text-text-muted">
            Conectado como:
          </p>
          <p className="text-sm font-medium text-text-secondary">
            {user?.email}
          </p>
        </div>
      </div>
    </div>
  );
}
