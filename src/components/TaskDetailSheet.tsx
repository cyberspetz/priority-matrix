"use client";

import { Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Project, Task, TaskUpdatePayload } from '@/lib/supabaseClient';
import TaskInlineEditor from './TaskInlineEditor';
import { getPriorityMeta } from '@/lib/priority';

interface TaskDetailSheetProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: TaskUpdatePayload) => Promise<void> | void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  projects: Project[];
}

export default function TaskDetailSheet({ task, isOpen, onClose, onUpdate, onToggleComplete, onDelete, onArchive, projects }: TaskDetailSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const priorityMeta = task ? getPriorityMeta(task.priority_level ?? 'p3') : null;

  return createPortal(
    <Transition show={isOpen} as={Fragment} appear>
      <div className="fixed inset-0 z-[2147483646] flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center">
        <Transition.Child
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="translate-y-full opacity-0 md:scale-95"
          enterTo="translate-y-0 opacity-100 md:scale-100"
          leave="transition ease-in duration-200"
          leaveFrom="translate-y-0 opacity-100 md:scale-100"
          leaveTo="translate-y-full opacity-0 md:scale-95"
        >
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border bg-[var(--color-surface)] shadow-2xl" style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-soft)' }}>
            <header className="flex items-start justify-between gap-3 px-5 py-4">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => task && onToggleComplete(task.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: task?.is_completed ? 'var(--color-secondary-500)' : 'var(--color-border)',
                    background: task?.is_completed ? 'var(--color-secondary-500)' : 'transparent',
                    color: task?.is_completed ? '#ffffff' : 'var(--color-text-muted)'
                  }}
                  aria-label={task?.is_completed ? 'Mark task incomplete' : 'Mark task complete'}
                >
                  {task?.is_completed ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-[var(--color-text-900)]">
                    {task?.title ?? 'Task details'}
                  </h2>
                  {task?.notes && <p className="text-sm text-[var(--color-text-muted)]">{task.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {priorityMeta && (
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      background: priorityMeta.badgeFillColor ?? 'rgba(255,113,103,0.18)',
                      color: priorityMeta.badgeTextColor ?? 'var(--color-primary-600)'
                    }}
                  >
                    <span className={`h-2 w-2 rounded-full ${priorityMeta.dotFill}`} aria-hidden />
                    {priorityMeta.name}
                  </span>
                )}
                <button
                  onClick={onClose}
                  className="rounded-full border border-transparent bg-[rgba(148,163,184,0.16)] p-2 text-[var(--color-text-muted)] transition hover:bg-[rgba(148,163,184,0.24)]"
                  aria-label="Close task details"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </header>

            {task && (
              <TaskInlineEditor
                key={task.id}
                task={task}
                projects={projects}
                onSave={async (updates) => {
                  await onUpdate(task.id, updates);
                  onClose();
                }}
                onCancel={onClose}
              />
            )}

            {task && (
              <footer className="flex items-center justify-between border-t border-[rgba(148,163,184,0.16)] bg-[var(--color-surface-muted)] px-5 py-3">
                <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                  {onArchive && (
                    <button
                      type="button"
                      onClick={() => {
                        onArchive(task.id);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[var(--color-text-700)] hover:bg-[rgba(148,163,184,0.2)]"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V7a2 2 0 00-2-2h-3.586a1 1 0 01-.707-.293L11.414 3H6a2 2 0 00-2 2v8" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 13l4 8h8l4-8" />
                      </svg>
                      Archive
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(task.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[var(--color-danger)] hover:bg-[rgba(255,113,103,0.12)]"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 0V4a1 1 0 011-1h2a1 1 0 011 1v3m-4 4v6m4-6v6" />
                    </svg>
                    Delete
                  </button>
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">
                  Last updated {task?.updated_at ? new Date(task.updated_at).toLocaleString() : 'n/a'}
                </span>
              </footer>
            )}
          </div>
        </Transition.Child>
      </div>
    </Transition>,
    document.body
  );
}
