import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, fullName);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-surface-border">
        <h2 className="text-3xl font-bold text-center text-accent-blue">Pendientes Dashboard</h2>
        <p className="text-center text-text-secondary">{isLogin ? 'Acceso interno' : 'Registro de nuevo usuario'}</p>
        
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Nombre para mostrar</label>
              <input 
                type="text" 
                required 
                value={fullName} 
                onChange={e => setFullName(e.target.value)}
                className="w-full p-3 bg-white border border-surface-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent-blue focus:outline-none transition placeholder:text-text-muted" 
                placeholder="Juan Pérez"
              />
              <p className="text-xs text-text-muted mt-1">Este nombre será visible para otros miembros del equipo</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 bg-white border border-surface-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent-blue focus:outline-none transition placeholder:text-text-muted" 
              placeholder="nombre@productora.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Contraseña</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 bg-white border border-surface-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent-blue focus:outline-none transition" 
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-accent-blue text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 transition disabled:opacity-50">
            {loading ? 'Procesando...' : (isLogin ? 'Ingresar' : 'Registrarse')}
          </button>
        </form>

        {/* Separador */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-text-muted">o continuar con</span>
          </div>
        </div>

        {/* Botón de Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full py-3 px-4 flex items-center justify-center gap-3 bg-surface-elevated text-text-primary font-semibold rounded-lg hover:bg-surface-hover border border-surface-border focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 transition disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {googleLoading ? 'Conectando...' : 'Continuar con Google'}
        </button>

        <p className="text-center text-xs text-text-muted mt-2">
          Al continuar con Google, te pediremos elegir tu nombre para mostrar
        </p>

        <div className="text-center mt-4">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-accent-blue hover:text-blue-700 transition"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
