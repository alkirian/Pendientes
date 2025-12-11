-- RUN THIS IN SUPABASE SQL EDITOR

create table if not exists task_activities (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  type text default 'comment' not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table task_activities enable row level security;

-- Policies
create policy "Users can view activities in their projects"
  on task_activities for select
  using (
    exists (
      select 1 from tasks t
      join project_members pm on pm.project_id = t.project_id
      where t.id = task_activities.task_id
      and pm.user_id = auth.uid()
    )
  );

create policy "Users can insert activities in their projects"
  on task_activities for insert
  with check (
    exists (
      select 1 from tasks t
      join project_members pm on pm.project_id = t.project_id
      where t.id = task_activities.task_id
      and pm.user_id = auth.uid()
    )
  );
