import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

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

export interface Task {
  id: string;
  title: string;
  description?: string;
  quadrant: 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';

  // Enhanced status system
  status: TaskStatus;
  is_completed: boolean; // Keep for backward compatibility

  // Priority and scheduling
  priority: number; // Keep for backward compatibility
  priority_level: TaskPriority;
  due_date?: string;

  // Time tracking
  time_estimate?: number; // in minutes
  actual_time?: number;   // in minutes

  // Organization
  tags?: string[];
  notes?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at?: string;
  archived_at?: string;

  // User
  user_id?: string;
}

// Get all active tasks (non-archived)
export const getAllTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .neq('status', 'archived')
    .order('priority_level', { ascending: true })
    .order('due_date', { ascending: true, nullsLast: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }

  return data || [];
};

// Get tasks by status
export const getTasksByStatus = async (status: TaskStatus): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks by status:', error);
    throw error;
  }

  return data || [];
};

// Get completed tasks for reporting
export const getCompletedTasks = async (startDate?: string, endDate?: string): Promise<Task[]> => {
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false });

  if (startDate) {
    query = query.gte('completed_at', startDate);
  }
  if (endDate) {
    query = query.lte('completed_at', endDate);
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

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
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
  priority: number = 0,
  due_date?: string,
  user_id?: string,
  priority_level: TaskPriority = 'p3',
  time_estimate?: number,
  tags?: string[],
  notes?: string
): Promise<Task> => {
  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        title,
        description,
        quadrant,
        status: 'active',
        is_completed: false,
        priority,
        priority_level,
        due_date,
        time_estimate,
        tags,
        notes,
        user_id,
      },
    ])
    .select()
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
  updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>
): Promise<Task> => {
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating task:', error);
    throw error;
  }

  return data;
};

// Delete a task
export const deleteTask = async (id: string): Promise<void> => {
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
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error archiving task:', error);
    throw error;
  }

  return data;
};

// Complete a task
export const completeTask = async (id: string, actual_time?: number): Promise<Task> => {
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
    .select()
    .single();

  if (error) {
    console.error('Error completing task:', error);
    throw error;
  }

  return data;
};

// Uncomplete a task
export const uncompleteTask = async (id: string): Promise<Task> => {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'active',
      is_completed: false,
      completed_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error uncompleting task:', error);
    throw error;
  }

  return data;
};

// Bulk archive completed tasks
export const archiveCompletedTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('status', 'completed')
    .select();

  if (error) {
    console.error('Error archiving completed tasks:', error);
    throw error;
  }

  return data || [];
};