-- Función para que un usuario pueda eliminar su propia cuenta
-- Se debe ejecutar en el SQL Editor de Supabase Dashboard
-- VERSIÓN COMPLETA - Maneja TODAS las dependencias de foreign key

create or replace function delete_own_account()
returns void
language plpgsql
security definer
as $$
begin
  -- 1. Eliminar notificaciones del usuario
  delete from public.notifications where user_id = auth.uid();

  -- 2. Eliminar asignaciones de tareas del usuario (como asignado)
  delete from public.task_assignments where user_id = auth.uid();

  -- 3. Eliminar asignaciones de tareas de las tareas creadas por el usuario
  delete from public.task_assignments where task_id in (
    select id from public.tasks where created_by = auth.uid()
  );

  -- 4. Eliminar actividades de tareas del usuario
  delete from public.task_activities where user_id = auth.uid();

  -- 5. Eliminar actividades de las tareas creadas por el usuario
  delete from public.task_activities where task_id in (
    select id from public.tasks where created_by = auth.uid()
  );

  -- 6. Eliminar miembros de proyectos vinculados a este usuario
  delete from public.project_members where user_id = auth.uid();

  -- 7. Eliminar tareas creadas por este usuario
  delete from public.tasks where created_by = auth.uid();

  -- 8. Eliminar el perfil público del usuario
  delete from public.profiles where id = auth.uid();
  
  -- 9. Finalmente eliminar la cuenta de autenticación
  delete from auth.users where id = auth.uid();
end;
$$;

-- Conceder permiso de ejecución al rol 'authenticated' (usuarios logueados)
GRANT EXECUTE ON FUNCTION delete_own_account() TO authenticated;
