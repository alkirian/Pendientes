-- Migración: Agregar rol a project_members
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columna role a project_members
ALTER TABLE project_members 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'miembro';

-- 2. Agregar rol por defecto a profiles (opcional, para sugerir rol)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS default_role TEXT DEFAULT 'miembro';

-- 3. Crear bucket para avatares (si no existe, hacer desde Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
