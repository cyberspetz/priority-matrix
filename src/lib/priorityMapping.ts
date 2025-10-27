import type { Task, TaskPriority } from './supabaseClient';

/**
 * Maps Eisenhower Matrix quadrants to priority levels
 * This creates an intelligent system where:
 * - Quadrant determines priority automatically
 * - Priority level reflects importance and urgency
 * - Today view can intelligently show high-priority tasks
 */

export const QUADRANT_PRIORITY_MAP: Record<Task['quadrant'], TaskPriority> = {
  'urgent-important': 'p1',        // Do First - Highest priority
  'not-urgent-important': 'p2',     // Schedule - High priority (Important!)
  'urgent-not-important': 'p3',     // Delegate - Medium priority
  'not-urgent-not-important': 'p4', // Eliminate - Low priority
};

export const PRIORITY_QUADRANT_MAP: Record<TaskPriority, Task['quadrant']> = {
  'p1': 'urgent-important',
  'p2': 'not-urgent-important',
  'p3': 'urgent-not-important',
  'p4': 'not-urgent-not-important',
};

/**
 * Get the priority level for a given quadrant
 */
export function getPriorityForQuadrant(quadrant: Task['quadrant']): TaskPriority {
  return QUADRANT_PRIORITY_MAP[quadrant];
}

/**
 * Get the quadrant for a given priority level
 */
export function getQuadrantForPriority(priority: TaskPriority): Task['quadrant'] {
  return PRIORITY_QUADRANT_MAP[priority];
}

/**
 * Check if a task should appear in "Today" based on priority
 * P1 and P2 are "Important" tasks that should be in Today
 */
export function isImportantTask(priority: TaskPriority | null | undefined): boolean {
  return priority === 'p1' || priority === 'p2';
}

/**
 * Sort tasks by priority (P1 first, P4 last)
 */
export function sortByPriority(tasks: Task[]): Task[] {
  const priorityOrder = { p1: 0, p2: 1, p3: 2, p4: 3 };
  return [...tasks].sort((a, b) => {
    const aPriority = a.priority_level ?? 'p4';
    const bPriority = b.priority_level ?? 'p4';
    return priorityOrder[aPriority as TaskPriority] - priorityOrder[bPriority as TaskPriority];
  });
}

/**
 * Get human-readable priority name
 */
export function getPriorityName(priority: TaskPriority): string {
  const names = {
    p1: 'Do First',
    p2: 'Schedule',
    p3: 'Delegate',
    p4: 'Eliminate',
  };
  return names[priority];
}
