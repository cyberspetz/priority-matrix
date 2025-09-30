"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Project, Task, TaskPriority, TaskUpdatePayload } from '@/lib/supabaseClient';
import { getPriorityMeta, PRIORITY_ORDER } from '@/lib/priority';

interface TaskInlineEditorProps {
  task: Task;
  projects: Project[];
  onSave: (updates: TaskUpdatePayload) => Promise<void> | void;
  onCancel: () => void;
}

const dateOptions = (base: Date) => {
  const clone = (days: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
  };

  const toISO = (d: Date) => d.toISOString().split('T')[0];

  return [
    { label: 'Today', value: toISO(base), accent: 'text-emerald-600' },
    { label: 'Tomorrow', value: toISO(clone(1)), accent: 'text-amber-600' },
    { label: 'This weekend', value: toISO(clone( Math.max(1, 6 - base.getDay()) )), accent: 'text-rose-600' },
    { label: 'Next week', value: toISO(clone(7)), accent: 'text-indigo-600' },
    { label: 'No date', value: null, accent: 'text-gray-500' },
  ] as const;
};

const formatDateChip = (value?: string | null) => {
  if (!value) return 'Add date';
  const parsed = new Date(value);
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function TaskInlineEditor({ task, projects, onSave, onCancel }: TaskInlineEditorProps) {
  const [title, setTitle] = useState(task.title ?? '');
  const [description, setDescription] = useState(task.notes ?? '');
  const [dueDate, setDueDate] = useState<string | null>(task.due_date ?? null);
  const [deadlineAt, setDeadlineAt] = useState<string | null>(task.deadline_at ?? null);
  const [priority, setPriority] = useState<TaskPriority>(task.priority_level ?? 'p3');
  const [projectId, setProjectId] = useState<string>(task.project_id ?? projects.find(p => p.is_default)?.id ?? projects[0]?.id ?? '');
  const [showDueMenu, setShowDueMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showDeadlineMenu, setShowDeadlineMenu] = useState(false);
  const [saving, setSaving] = useState(false);

  const priorityMeta = getPriorityMeta(priority);

  const handleSave = async () => {
    if (!title.trim()) return;
    try {
      setSaving(true);
      const updates: TaskUpdatePayload = {
        title: title.trim(),
        notes: description.trim() ? description : null,
        due_date: dueDate,
        deadline_at: deadlineAt,
        priority_level: priority,
        project_id: projectId || null,
      };
      await onSave(updates);
    } finally {
      setSaving(false);
    }
  };

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0,0,0,0);
    return now;
  }, []);

  useEffect(() => {
    if (!projects.length) return;
    setProjectId(prev => prev || projects.find(p => p.is_default)?.id ?? projects[0].id);
  }, [projects]);

  useEffect(() => {
    setProjectId(task.project_id ?? projects.find(p => p.is_default)?.id ?? projects[0]?.id ?? '');
  }, [task.id, task.project_id, projects]);

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="space-y-3">
        <textarea
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Task name"
          className="w-full resize-none border-none bg-transparent text-base font-semibold text-gray-900 focus:outline-none focus:ring-0"
          rows={1}
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          className="w-full resize-none rounded-lg border border-transparent bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-gray-300 focus:outline-none"
          rows={2}
        />

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowDueMenu(prev => !prev); setShowPriorityMenu(false); setShowDeadlineMenu(false); }}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${dueDate ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDateChip(dueDate)}
            </button>
            {showDueMenu && (
              <div className="absolute left-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                <div className="space-y-1">
                  {dateOptions(today).map(option => (
                    <button
                      key={`due-${option.label}`}
                      type="button"
                      onClick={() => { setDueDate(option.value); setShowDueMenu(false); }}
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                    >
                      <span>{option.label}</span>
                      <span className={`text-xs ${option.accent}`}>{option.value ? formatDateChip(option.value) : ''}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-2 border-t border-gray-100 pt-2">
                  <input
                    type="date"
                    value={dueDate ?? ''}
                    onChange={(event) => setDueDate(event.target.value || null)}
                    className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowPriorityMenu(prev => !prev); setShowDueMenu(false); setShowDeadlineMenu(false); }}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${priorityMeta.pillTone}`}
            >
              <svg className={`h-3.5 w-3.5 ${priorityMeta.iconFill}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a1 1 0 011-1h8a1 1 0 01.8 1.6L13.25 7l1.55 2.4A1 1 0 0114 11H6v6a1 1 0 11-2 0V3z" />
              </svg>
              {priorityMeta.flagLabel.toUpperCase()}
            </button>
            {showPriorityMenu && (
              <div className="absolute left-0 z-50 mt-2 w-44 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg">
                {PRIORITY_ORDER.map(level => {
                  const meta = getPriorityMeta(level);
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => { setPriority(level); setShowPriorityMenu(false); }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
                    >
                      <svg className={`h-3 w-3 ${meta.iconFill}`} viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 3a1 1 0 011-1h8a1 1 0 01.8 1.6L13.25 7l1.55 2.4A1 1 0 0114 11H6v6a1 1 0 11-2 0V3z" />
                      </svg>
                      <span className="flex-1">{meta.name}</span>
                      <span className="text-xs text-gray-400">{meta.flagLabel.toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowDeadlineMenu(prev => !prev); setShowDueMenu(false); setShowPriorityMenu(false); }}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${deadlineAt ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
              </svg>
              {deadlineAt ? formatDateChip(deadlineAt) : 'Deadline'}
            </button>
            {showDeadlineMenu && (
              <div className="absolute left-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => { setDeadlineAt(null); setShowDeadlineMenu(false); }}
                    className="w-full rounded-md px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
                  >
                    No deadline
                  </button>
                </div>
                <div className="mt-2 border-t border-gray-100 pt-2">
                  <input
                    type="date"
                    value={deadlineAt ?? ''}
                    onChange={(event) => setDeadlineAt(event.target.value || null)}
                    className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:border-rose-400 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs uppercase tracking-wide text-gray-400">Project</span>
            <div className="relative">
              <select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
              >
                {projects.length === 0 && <option value="">Inbox</option>}
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Cancel"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="rounded-full bg-rose-500 p-2 text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
              aria-label="Save"
            >
              {saving ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v2m0 12v2m8-8h-2M6 12H4m13.657-6.657l-1.414 1.414M7.757 16.243l-1.414 1.414M16.243 16.243l1.414 1.414M7.757 7.757L6.343 6.343" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
