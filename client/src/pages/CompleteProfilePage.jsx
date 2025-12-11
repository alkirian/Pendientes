import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CompleteProfilePage() {
  const { user, profile, needsProfileCompletion, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If profile is already complete, redirect to dashboard
  useEffect(() => {
    if (!needsProfileCompletion) {
      navigate('/');
    }
  }, [needsProfileCompletion, navigate]);

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
      await updateProfile({ full_name: displayName.trim() });
      // updateProfile will refresh the profile and needsProfileCompletion will become false
      // The useEffect above will then redirect to dashboard
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-surface-border">
        <div className="text-center">
          <div className="w-16 h-16 bg-accent-blue rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary">¡Un paso más!</h2>
          <p className="text-text-secondary mt-2">
            Elige el nombre que se mostrará para ti en el equipo
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Tu nombre para mostrar
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-3 bg-white border border-surface-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent-blue focus:outline-none transition placeholder:text-text-muted text-lg"
              placeholder="Ej: Juan Pérez"
              autoFocus
            />
            <p className="text-xs text-text-muted mt-2">
              Este nombre será visible para todos los miembros del equipo
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
