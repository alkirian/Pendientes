import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
    
    // Check if profile needs completion (no display_name_confirmed flag or no full_name)
    // We use a custom field to track if user explicitly chose their name
    if (!data?.display_name_confirmed) {
      setNeedsProfileCompletion(true);
    } else {
      setNeedsProfileCompletion(false);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setNeedsProfileCompletion(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signup = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    if (error) throw error;
    
    // After signup, also update the profile with confirmed name
    if (data.user) {
      await supabase.from('profiles').update({ 
        full_name: fullName,
        display_name_confirmed: true 
      }).eq('id', data.user.id);
    }
    
    return data;
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, display_name_confirmed: true })
      .eq('id', user.id);
    
    if (error) throw error;
    
    // Refresh profile
    await fetchProfile(user.id);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
    if (error) throw error;
    return data;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      login, 
      signup, 
      logout, 
      loginWithGoogle, 
      loading, 
      needsProfileCompletion,
      updateProfile 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

