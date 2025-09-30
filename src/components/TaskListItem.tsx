"use client";

import React, { useMemo } from 'react';
import type { Project, Task, TaskUpdatePayload } from '@/lib/supabaseClient';
import { getPriorityMeta } from '@/lib/priority';
import TaskActionMenu from './TaskActionMenu';
import TaskInlineEditor from './TaskInlineEditor';

interface TaskListItemProps {
  task: Task;
  quadrant: 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';
  onToggleComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updates: TaskUpdatePayload) => void;
  onOpenDetail?: (id: string) => void;
  onArchive?: (id: string) => void;
  projects: Project[];
  isEditing?: boolean;
  onEnterEdit?: (id: string) => void;
  onExitEdit?: () => void;
}

const quadrantAccent: Record<TaskListItemProps['quadrant'], string> = {
  'urgent-important': 'md:border-l-4 md:border-emerald-400',
  'not-urgent-important': 'md:border-l-4 md:border-sky-400',
  'urgent-not-important': 'md:border-l-4 md:border-amber-400',
  'not-urgent-not-important': 'md:border-l-4 md:border-slate-300',
};

function dueChip(due?: string) {
  if (!due) return null;
  const [datePart] = due.split('T');
  const target = new Date(datePart);
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const local = (d: Date) => d.toISOString().split('T')[0];
  const todayStr = local(today);
  const tomorrowStr = local(tomorrow);

  if (datePart < todayStr) return { text: 'Overdue', classes: 'text-rose-700 bg-rose-50' };
  if (datePart === todayStr) return { text: 'Today', classes: 'text-emerald-700 bg-emerald-50' };
  if (datePart === tomorrowStr) return { text: 'Tomorrow', classes: 'text-amber-700 bg-amber-50' };
  return {
    text: target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    classes: 'text-violet-700 bg-violet-50',
  };
}

export default function TaskListItem({
  task,
  quadrant,
  onToggleComplete,
  onDelete,
  onUpdate,
  onOpenDetail,
  onArchive,
  projects,
  isEditing,
  onEnterEdit,
  onExitEdit,
}: TaskListItemProps) {
  const due = !task.is_completed ? dueChip(task.due_date) : null;
  const isDeadlineOver = task.deadline_at ? new Date(task.deadline_at) < new Date() : false;
  const priorityMeta = getPriorityMeta(task.priority_level ?? 'p3');

  const currentProjectName = useMemo(() => {
    if (task.project?.name) return task.project.name;
    const matched = task.project_id ? projects.find(project => project.id === task.project_id) : null;
    return matched?.name ?? projects.find(p => p.is_default)?.name ?? projects[0]?.name ?? 'Inbox';
  }, [task.project, task.project_id, projects]);

  if (isEditing && onUpdate) {
    return (
      <TaskInlineEditor
        task={task}
        projects={projects}
        onCancel={onExitEdit ?? (() => {})}
        onSave={(updates) => onUpdate(task.id, updates)}
      />
    );
  }

  return (
    <div
      id={`task-${task.id}`}
      role="button"
      tabIndex={0}
      onClick={(event) => {
        if (!onOpenDetail) return;
        const target = event.target as HTMLElement;
        if (target?.closest('[data-skip-task-detail="true"]')) return;
        onOpenDetail(task.id);
      }}
      onDoubleClick={(event) => {
        if (!onOpenDetail) return;
        const target = event.target as HTMLElement;
        if (target?.closest('[data-skip-task-detail="true"]')) return;
        event.preventDefault();
        onOpenDetail(task.id);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetail?.(task.id);
        }
      }}
      className={`group flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-3 shadow-sm transition hover:border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:px-4 md:py-4 ${quadrantAccent[quadrant]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <button
            type="button"
            data-skip-task-detail="true"
            onClick={(event) => {
              event.stopPropagation();
              onToggleComplete?.(task.id);
            }}
            className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
              task.is_completed ? `${priorityMeta.circleBorder} ${priorityMeta.completedFill}` : `${priorityMeta.circleBorder} ${priorityMeta.circleFill}`
            }`}
            aria-label={task.is_completed ? 'Mark incomplete' : 'Mark complete'}
          >
            {task.is_completed && (
              <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="min-w-0 flex-1 space-y-1">
            <div className={`text-[0.95rem] font-medium md:text-sm ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {task.title}
            </div>
            { (task.notes || task.description) && (
              <p className="text-[0.75rem] text-gray-500 md:text-xs line-clamp-2">{task.notes ?? task.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 text-[0.7rem] md:text-xs" data-skip-task-detail="true">
              <button
                type="button"
                data-priority-pill
                data-priority-level={task.priority_level}
                onClick={(event) => {
                  if (!onEnterEdit) return;
                  event.stopPropagation();
                  onEnterEdit(task.id);
                }}
                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium ${priorityMeta.badgeTone} ${priorityMeta.badgeText}`}
                aria-label={`Adjust priority (${priorityMeta.flagLabel})`}
              >
                <svg className={`h-[0.65rem] w-[0.65rem] ${priorityMeta.iconFill}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M5 3a1 1 0 011-1h8a1 1 0 01.8 1.6L13.25 7l1.55 2.4A1 1 0 0114 11H6v6a1 1 0 11-2 0V3z" />
                </svg>
                {priorityMeta.flagLabel}
              </button>
                {due && (
                  <button
                    type="button"
                    title="Scheduled start"
                    onClick={(event) => {
                      if (!onEnterEdit) return;
                      event.stopPropagation();
                      onEnterEdit(task.id);
                    }}
                    className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium ${due.classes}`}
                    aria-label={`Adjust schedule (${due.text})`}
                  >
                  <svg className="h-[0.7rem] w-[0.7rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {due.text}
                </button>
              )}
                {task.deadline_at && !task.is_completed && (
                  <button
                    type="button"
                    title="Deadline"
                    onClick={(event) => {
                      if (!onEnterEdit) return;
                      event.stopPropagation();
                      onEnterEdit(task.id);
                    }}
                    className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium ${
                      isDeadlineOver ? 'text-rose-700 bg-rose-50' : 'text-slate-700 bg-slate-100'
                    }`}
                    aria-label="Adjust deadline"
                >
                  <svg className="h-[0.7rem] w-[0.7rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                  </svg>
                  Deadline
                </button>
              )}
            </div>
          </div>
        </div>

        <div
          className="flex items-start gap-1 opacity-0 transition-opacity duration-150 group-active:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100"
          data-skip-task-detail="true"
        >
          {(onArchive || onDelete || onOpenDetail) && (
            <TaskActionMenu id={task.id} title={task.title} onArchive={onArchive} onDelete={onDelete} onOpenDetail={onOpenDetail} />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500" data-skip-task-detail="true">
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-600">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M5 7l.867 12.142A2 2 0 007.862 21h8.276a2 2 0 001.995-1.858L19 7m-5-4h-4l-1 4h6l-1-4z" />
          </svg>
          {currentProjectName}
        </span>
        {onEnterEdit && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            onClick={(event) => {
              event.stopPropagation();
              onEnterEdit(task.id);
            }}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 13.5V16h2.5L15 7.5l-2.5-2.5L4 13.5z" />
            </svg>
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
