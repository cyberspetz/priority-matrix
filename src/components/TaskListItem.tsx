"use client";
import React from 'react';
import type { TaskPriority, TaskUpdatePayload } from '@/lib/supabaseClient';
import { getPriorityMeta } from '@/lib/priority';

interface TaskListItemProps {
  id: string;
  title: string;
  quadrant: 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';
  dueDate?: string;
  deadlineAt?: string;
  isCompleted: boolean;
  priority: TaskPriority;
  onToggleComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updates: TaskUpdatePayload) => void;
  onOpenDetail?: (id: string) => void;
  onArchive?: (id: string) => void;
}

const quadrantAccent: Record<TaskListItemProps['quadrant'], string> = {
  'urgent-important': 'border-emerald-400',
  'not-urgent-important': 'border-sky-400',
  'urgent-not-important': 'border-amber-400',
  'not-urgent-not-important': 'border-slate-300',
};

function dueChip(due?: string) {
  if (!due) return null;

  const [datePart] = due.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return null;

  const target = new Date(year, month - 1, day);

  const localDateString = (source: Date) => {
    const y = source.getFullYear();
    const m = String(source.getMonth() + 1).padStart(2, '0');
    const d = String(source.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const today = new Date();
  const todayStr = localDateString(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = localDateString(tomorrow);

  if (datePart < todayStr) return { text: 'Overdue', classes: 'text-rose-700 bg-rose-50' };
  if (datePart === todayStr) return { text: 'Today', classes: 'text-emerald-700 bg-emerald-50' };
  if (datePart === tomorrowStr) return { text: 'Tomorrow', classes: 'text-amber-700 bg-amber-50' };

  return {
    text: target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    classes: 'text-violet-700 bg-violet-50',
  };
}

import QuickScheduleMenu from './QuickScheduleMenu';
import TaskActionMenu from './TaskActionMenu';

export default function TaskListItem({ id, title, quadrant, dueDate, deadlineAt, isCompleted, priority, onToggleComplete, onDelete, onUpdate, onOpenDetail, onArchive }: TaskListItemProps) {
  const due = !isCompleted ? dueChip(dueDate) : null;
  const isDeadlineOver = deadlineAt ? new Date(deadlineAt) < new Date() : false;
  const priorityMeta = getPriorityMeta(priority);

  return (
    <div
      id={`task-${id}`}
      role="button"
      tabIndex={0}
      onClick={(event) => {
        if (!onOpenDetail) return;
        const target = event.target as HTMLElement;
        if (target?.closest('[data-skip-task-detail="true"]')) return;
        onOpenDetail(id);
      }}
      onDoubleClick={(event) => {
        if (!onOpenDetail) return;
        const target = event.target as HTMLElement;
        if (target?.closest('[data-skip-task-detail="true"]')) return;
        event.preventDefault();
        onOpenDetail(id);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetail?.(id);
        }
      }}
      className={`group flex flex-wrap items-start gap-2 border-b border-gray-200/70 bg-transparent px-2 py-2 transition-colors hover:border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:rounded-xl md:border md:${quadrantAccent[quadrant]} md:border-l-4 md:bg-white/95 md:px-4 md:py-3 md:shadow-none`}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <button
            type="button"
            data-skip-task-detail="true"
            onClick={(event) => {
              event.stopPropagation();
              onToggleComplete?.(id);
            }}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              isCompleted ? `${priorityMeta.circleBorder} ${priorityMeta.completedFill}` : `${priorityMeta.circleBorder} ${priorityMeta.circleFill}`
            }`}
            aria-label="Toggle complete"
          >
            {isCompleted && (
              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
            )}
          </button>

          <div className="flex-1 min-w-0 space-y-0.5">
            <div className={`text-[0.95rem] md:text-sm ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>{title}</div>
            <div className="flex flex-wrap items-center gap-1.5 text-[0.7rem] md:text-xs">
              <span
                data-priority-pill
                data-priority-level={priority}
                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium ${priorityMeta.badgeTone} ${priorityMeta.badgeText}`}
              >
                <svg className={`h-[0.65rem] w-[0.65rem] ${priorityMeta.iconFill}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M5 3a1 1 0 011-1h8a1 1 0 01.8 1.6L13.25 7l1.55 2.4A1 1 0 0114 11H6v6a1 1 0 11-2 0V3z" />
                </svg>
                {priorityMeta.flagLabel}
              </span>
              {due && (
                <span title="Scheduled start" className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium ${due.classes}`}>{due.text}</span>
              )}
              {deadlineAt && !isCompleted && (
                <span title="Deadline" className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium ${isDeadlineOver ? 'text-rose-700 bg-rose-50' : 'text-slate-700 bg-slate-100'}`}>Deadline</span>
              )}
            </div>
          </div>
        </div>

        <div
          className="flex items-start gap-1 opacity-0 transition-opacity duration-150 group-active:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100"
          data-skip-task-detail="true"
        >
          {onUpdate && (
            <QuickScheduleMenu id={id} dueDate={dueDate} deadlineAt={deadlineAt} priority={priority} onUpdate={onUpdate} />
          )}
          {(onArchive || onDelete || onOpenDetail) && (
            <TaskActionMenu id={id} title={title} onArchive={onArchive} onDelete={onDelete} onOpenDetail={onOpenDetail} />
          )}
        </div>
      </div>
    </div>
  );
}
