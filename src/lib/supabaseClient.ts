import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fail fast in production if Supabase env vars are misconfigured
if (process.env.NODE_ENV === 'production') {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase env vars: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  if (supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    throw new Error('Invalid Supabase config: remove placeholder values in production');
  }
}

// Lightweight dev-time diagnostics without exposing secrets
if (process.env.NODE_ENV !== 'production') {
  // Log presence and length only
  console.info('[supabase] env loaded:', {
    urlPresent: Boolean(supabaseUrl),
    keyPresent: Boolean(supabaseKey),
    keyLength: supabaseKey?.length ?? 0,
  });
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  global: {
    headers: {
      // Ensure headers are always present in browser requests
      apikey: supabaseKey || '',
      Authorization: `Bearer ${supabaseKey || ''}`,
    },
  },
});

const DEMO = process.env.NEXT_PUBLIC_DEMO === '1';

export type TaskStatus =
  | 'active'      // Currently working on
  | 'completed'   // Done
  | 'archived'    // Hidden from main view but kept for reports
  | 'cancelled'   // Cancelled tasks
  | 'deferred';   // Postponed tasks

export type TaskPriority =
  | 'p1'  // High priority (red)
  | 'p2'  // Medium priority (orange)
  | 'p3'  // Normal priority (blue)
  | 'p4'; // Low priority (gray)

export type ProjectLayout = 'board' | 'list' | 'calendar';

export interface Project {
  id: string;
  name: string;
  color?: string | null;
  is_default?: boolean | null;
  layout?: ProjectLayout | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  quadrant: 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';

  // Enhanced status system
  status: TaskStatus;
  is_completed: boolean; // Keep for backward compatibility

  // Priority and scheduling
  priority_level: TaskPriority;
  due_date?: string;
  // Manual ordering within a quadrant
  sort_index?: number;
  // Optional hard deadline distinct from due_date
  deadline_at?: string;

  // Time tracking
  time_estimate?: number; // in minutes
  actual_time?: number;   // in minutes

  // Organization
  tags?: string[];
  notes?: string;
  project_id?: string;
  project?: Project;

  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at?: string;
  archived_at?: string;

  // User
  user_id?: string;
}

type BaseTaskUpdate = Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>;

export type TaskUpdatePayload = BaseTaskUpdate & {
  due_date?: string | null;
  deadline_at?: string | null;
  notes?: string | null;
  completed_at?: string | null;
  archived_at?: string | null;
  project_id?: string | null;
};

// Get all active tasks (non-archived)
export const getAllTasks = async (): Promise<Task[]> => {
  if (DEMO) {
    return memTasks
      .filter(t => t.status !== 'archived')
      .map(task => {
        const project = task.project_id ? memProjects.find(p => p.id === task.project_id) : getDefaultProject();
        return { ...task, project } as Task;
      })
      .sort(sorter);
  }
  const { data, error } = await supabase
    .from('tasks')
    .select('*, project:projects(id, name, color, is_default, layout, created_at, updated_at)')
    .neq('status', 'archived')
    .order('sort_index', { ascending: true })
    .order('priority_level', { ascending: true })
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }

  return data || [];
};

// Get tasks by status
export const getTasksByStatus = async (status: TaskStatus): Promise<Task[]> => {
  if (DEMO) {
    return memTasks
      .filter(t => t.status === status)
      .map(task => {
        const project = task.project_id ? memProjects.find(p => p.id === task.project_id) : getDefaultProject();
        return { ...task, project } as Task;
      })
      .sort((a,b)=> (b.created_at> a.created_at?1:-1));
  }
  const { data, error } = await supabase
    .from('tasks')
    .select('*, project:projects(id, name, color, is_default, layout, created_at, updated_at)')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks by status:', error);
    throw error;
  }

  return data || [];
};

// Get completed tasks for reporting (includes archived items with a completion timestamp)
export const getCompletedTasks = async (startDate?: string, endDateExclusive?: string): Promise<Task[]> => {
  if (DEMO) {
    let data = memTasks.filter(t => t.completed_at && (t.status === 'completed' || t.status === 'archived'));
    if (startDate) data = data.filter(t => t.completed_at && t.completed_at >= startDate);
    if (endDateExclusive) data = data.filter(t => t.completed_at && t.completed_at < endDateExclusive);
    return data
      .map(task => {
        const project = task.project_id ? memProjects.find(p => p.id === task.project_id) : getDefaultProject();
        return { ...task, project } as Task;
      })
      .sort((a, b) => ((b.completed_at ?? '') > (a.completed_at ?? '') ? -1 : 1));
  }

  let query = supabase
    .from('tasks')
    .select('*, project:projects(id, name, color, is_default, layout, created_at, updated_at)')
    .in('status', ['completed', 'archived'])
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });

  if (startDate) {
    query = query.gte('completed_at', startDate);
  }
  if (endDateExclusive) {
    query = query.lt('completed_at', endDateExclusive);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching completed tasks:', error);
    throw error;
  }

  return data || [];
};

// Get overdue tasks
export const getOverdueTasks = async (): Promise<Task[]> => {
  const today = new Date().toISOString().split('T')[0];
  if (DEMO) {
    return memTasks
      .filter(t => t.status === 'active' && t.due_date && t.due_date < today)
      .map(task => {
        const project = task.project_id ? memProjects.find(p => p.id === task.project_id) : getDefaultProject();
        return { ...task, project } as Task;
      });
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('*, project:projects(id, name, color, is_default, layout, created_at, updated_at)')
    .eq('status', 'active')
    .lt('due_date', today)
    .not('due_date', 'is', null);

  if (error) {
    console.error('Error fetching overdue tasks:', error);
    throw error;
  }

  return data || [];
};

// Create a new task
export const createTask = async (
  title: string,
  quadrant: Task['quadrant'] = 'urgent-important',
  description?: string,
  due_date?: string,
  user_id?: string,
  priority_level: TaskPriority = 'p3',
  time_estimate?: number,
  tags?: string[],
  notes?: string,
  deadline_at?: string,
  project_id?: string
): Promise<Task> => {
  if (DEMO) {
    const now = new Date().toISOString();
    const nextIndex = Math.max(-1, ...memTasks.filter(t=> t.quadrant===quadrant).map(t=> t.sort_index ?? 0)) + 1;
    const fallbackProject = project_id ?? memProjects.find(p => p.is_default)?.id ?? memProjects[0]?.id;
    const t: Task = {
      id: `demo_${Math.random().toString(36).slice(2)}`,
      title,
      description,
      quadrant,
      status: 'active',
      is_completed: false,
      priority_level,
      due_date,
      deadline_at,
      sort_index: nextIndex,
      time_estimate,
      actual_time: undefined,
      tags,
      notes,
      user_id,
      project_id: fallbackProject,
      project: memProjects.find(p => p.id === fallbackProject),
      created_at: now,
      updated_at: now,
    };
    memTasks.push(t);
    return t;
  }
  // Determine next sort_index within the quadrant
  let nextIndex = 0;
  try {
    const { data: maxRow, error: maxErr } = await supabase
      .from('tasks')
      .select('sort_index')
      .eq('quadrant', quadrant)
      .order('sort_index', { ascending: false })
      .limit(1)
      .single();
    if (!maxErr && maxRow && typeof maxRow.sort_index === 'number') {
      nextIndex = (maxRow.sort_index ?? 0) + 1;
    }
  } catch {}

  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        title,
        description,
        quadrant,
        status: 'active',
        is_completed: false,
        priority_level,
        due_date,
        deadline_at,
        sort_index: nextIndex,
        time_estimate,
        tags,
        notes,
        user_id,
        project_id,
      },
    ])
    .select('*, project:projects(id, name, color, is_default, layout, created_at, updated_at)')
    .single();

  if (error) {
    console.error('Error creating task:', error);
    throw error;
  }

  return data;
};

// Update a task
export const updateTask = async (
  id: string,
  updates: TaskUpdatePayload
): Promise<Task> => {
  if (DEMO) {
    const idx = memTasks.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Not found');
    memTasks[idx] = { ...memTasks[idx], ...updates, updated_at: new Date().toISOString() } as Task;
    return memTasks[idx];
  }
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, project:projects(id, name, color, is_default, layout, created_at, updated_at)')
    .single();

  if (error) {
    console.error('Error updating task:', error);
    throw error;
  }

  return data;
};

// Delete a task
export const deleteTask = async (id: string): Promise<void> => {
  if (DEMO) {
    memTasks = memTasks.filter(t => t.id !== id);
    return;
  }
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Archive a task
export const archiveTask = async (id: string): Promise<Task> => {
  if (DEMO) {
    return updateTask(id, { status: 'archived', archived_at: new Date().toISOString() } satisfies TaskUpdatePayload);
  }
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*, project:projects(id, name, color, is_default, layout, created_at, updated_at)')
    .single();

  if (error) {
    console.error('Error archiving task:', error);
    throw error;
  }

  return data;
};

// Complete a task
export const completeTask = async (id: string, actual_time?: number): Promise<Task> => {
  if (DEMO) {
    return updateTask(id, { status: 'completed', is_completed: true, completed_at: new Date().toISOString(), actual_time } satisfies TaskUpdatePayload);
  }
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'completed',
      is_completed: true,
      completed_at: new Date().toISOString(),
      actual_time,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*, project:projects(id, name, color, is_default, layout, created_at, updated_at)')
    .single();

  if (error) {
    console.error('Error completing task:', error);
    throw error;
  }

  return data;
};

// Uncomplete a task
export const uncompleteTask = async (id: string): Promise<Task> => {
  if (DEMO) {
    return updateTask(id, { status: 'active', is_completed: false, completed_at: null } satisfies TaskUpdatePayload);
  }
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'active',
      is_completed: false,
      completed_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*, project:projects(id, name, color, is_default, layout, created_at, updated_at)')
    .single();

  if (error) {
    console.error('Error uncompleting task:', error);
    throw error;
  }

  return data;
};

// Bulk archive completed tasks
export const archiveCompletedTasks = async (): Promise<Task[]> => {
  if (DEMO) {
    memTasks = memTasks.map(t => t.status==='completed' ? { ...t, status:'archived', archived_at: new Date().toISOString() } as Task : t);
    return memTasks.filter(t => t.status==='archived');
  }
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('status', 'completed')
    .select('*, project:projects(id, name, color, is_default, layout, created_at, updated_at)');

  if (error) {
    console.error('Error archiving completed tasks:', error);
    throw error;
  }

  return data || [];
};

// In-memory data for demo mode
let memTasks: Task[] = [];
let memProjects: Project[] = [
  {
    id: 'proj_inbox',
    name: 'Inbox',
    color: null,
    is_default: true,
    layout: 'board',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
const sorter = (a: Task, b: Task) => {
  const ai = a.sort_index ?? 0;
  const bi = b.sort_index ?? 0;
  if (ai !== bi) return ai - bi;
  const ad = a.due_date ?? '';
  const bd = b.due_date ?? '';
  if (ad !== bd) return ad.localeCompare(bd);
  return a.created_at.localeCompare(b.created_at);
};

const getDefaultProject = (): Project => {
  let project = memProjects.find(p => p.is_default);
  if (!project) {
    project = { id: 'proj_inbox', name: 'Inbox', color: null, is_default: true, layout: 'board', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    memProjects.unshift(project);
  }
  return project;
};

export const getProjects = async (): Promise<Project[]> => {
  if (DEMO) {
    return memProjects
      .map(project => ({ ...project, layout: project.layout ?? 'board' }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    const defaultProject = await ensureDefaultProject();
    return [defaultProject];
  }

  return data.map(project => ({ ...project, layout: (project.layout ?? 'board') as ProjectLayout }));
};

export const ensureDefaultProject = async (): Promise<Project> => {
  if (DEMO) {
    return getDefaultProject();
  }

  const { data: currentDefault, error } = await supabase
    .from('projects')
    .select('*')
    .eq('is_default', true)
    .limit(1)
    .maybeSingle<Project>();

  if (error) {
    console.error('Failed to query default project:', error);
  }

  if (currentDefault) {
    return currentDefault;
  }

  const { data: created, error: createErr } = await supabase
    .from('projects')
    .insert([{ name: 'Inbox', is_default: true, layout: 'board' }])
    .select('*')
    .single();

  if (createErr) {
    console.error('Failed to create default project:', createErr);
    throw createErr;
  }

  return created;
};

export const createProject = async (name: string, color?: string | null, isDefault = false, layout: ProjectLayout = 'board'): Promise<Project> => {
  if (DEMO) {
    const now = new Date().toISOString();
    const project: Project = {
      id: `proj_${Math.random().toString(36).slice(2)}`,
      name,
      color: color ?? null,
      is_default: isDefault,
      layout,
      created_at: now,
      updated_at: now,
    };
    if (isDefault) {
      memProjects = memProjects.map(p => ({ ...p, is_default: false }));
    }
    memProjects.push(project);
    return project;
  }

  const { data, error } = await supabase
    .from('projects')
    .insert([{ name, color: color ?? null, is_default: isDefault, layout }])
    .select('*')
    .single();

  if (error) {
    console.error('Error creating project:', error);
    throw error;
  }

  return data;
};

export const updateProjectMeta = async (id: string, payload: Partial<Pick<Project, 'name' | 'color' | 'is_default' | 'layout'>>): Promise<Project> => {
  if (DEMO) {
    const idx = memProjects.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Project not found');
    if (payload.is_default) {
      memProjects = memProjects.map(p => ({ ...p, is_default: p.id === id }));
    }
    memProjects[idx] = { ...memProjects[idx], ...payload, updated_at: new Date().toISOString() };
    return memProjects[idx];
  }

  if (payload.is_default) {
    await supabase.from('projects').update({ is_default: false }).neq('id', id);
  }

  const { data, error } = await supabase
    .from('projects')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }

  return data;
};

export const deleteProject = async (id: string): Promise<void> => {
  if (DEMO) {
    const defaultProject = getDefaultProject();
    memTasks = memTasks.map(task => task.project_id === id ? { ...task, project_id: defaultProject.id, project: defaultProject } : task);
    memProjects = memProjects.filter(p => p.id !== id);
    if (!memProjects.some(p => p.is_default)) {
      memProjects = [defaultProject, ...memProjects.filter(p => p.id !== defaultProject.id)];
    }
    return;
  }

  const fallback = await ensureDefaultProject();

  await supabase
    .from('tasks')
    .update({ project_id: fallback.id })
    .eq('project_id', id);

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};
