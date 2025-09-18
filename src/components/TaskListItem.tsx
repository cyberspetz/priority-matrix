"use client";
import React from 'react';

interface TaskListItemProps {
  id: string;
  title: string;
  quadrant: 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';
  dueDate?: string;
  deadlineAt?: string;
  isCompleted: boolean;
  onToggleComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, newTitle: string) => void;
  onUpdate?: (id: string, updates: any) => void;
}

const quadrantAccent: Record<TaskListItemProps['quadrant'], string> = {
  'urgent-important': 'border-emerald-400',
  'not-urgent-important': 'border-sky-400',
  'urgent-not-important': 'border-amber-400',
  'not-urgent-not-important': 'border-slate-300',
};

function dueChip(due?: string) {
  if (!due) return null;
  const today = new Date();
  const date = new Date(due);
  const localStr = (d: Date) => d.toISOString().split('T')[0];
  const todayStr = localStr(new Date(today));
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = localStr(tomorrow);

  if (date < new Date(todayStr)) return { text: 'Overdue', classes: 'text-rose-700 bg-rose-50' };
  if (due === todayStr) return { text: 'Today', classes: 'text-emerald-700 bg-emerald-50' };
  if (due === tomorrowStr) return { text: 'Tomorrow', classes: 'text-amber-700 bg-amber-50' };
  return { text: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), classes: 'text-violet-700 bg-violet-50' };
}

import QuickScheduleMenu from './QuickScheduleMenu';
import TaskActionMenu from './TaskActionMenu';

export default function TaskListItem({ id, title, quadrant, dueDate, deadlineAt, isCompleted, onToggleComplete, onDelete, onEdit, onUpdate }: TaskListItemProps) {
  const due = dueChip(dueDate);
  const isDeadlineOver = deadlineAt ? new Date(deadlineAt) < new Date() : false;

  return (
    <div id={`task-${id}`} className={`flex items-center gap-3 p-3 bg-white rounded-lg border ${quadrantAccent[quadrant]} border-l-4`}> 
      <button
        onClick={() => onToggleComplete?.(id)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-400'}`}
        aria-label="Toggle complete"
      >
        {isCompleted && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className={`text-sm ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>{title}</div>
        <div className="mt-1 flex items-center gap-2 text-xs">
          {due && (
            <span className={`px-2 py-0.5 rounded-full font-medium ${due.classes}`}>{due.text}</span>
          )}
          {deadlineAt && (
            <span className={`px-2 py-0.5 rounded-full font-medium ${isDeadlineOver ? 'text-rose-700 bg-rose-50' : 'text-slate-700 bg-slate-100'}`}>Deadline</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {onUpdate && (
          <QuickScheduleMenu id={id} dueDate={dueDate} deadlineAt={deadlineAt} onUpdate={onUpdate} />
        )}
        {onDelete && (<TaskActionMenu id={id} title={title} onDelete={onDelete} />)}
      </div>
    </div>
  );
}
