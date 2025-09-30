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
          <div className="relative flex h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl md:h-auto md:max-w-2xl md:rounded-3xl">
            <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-3">
                {task && (
                  <button
                    type="button"
                    onClick={() => onToggleComplete(task.id)}
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                      task.is_completed ? `${priorityMeta?.circleBorder ?? 'border-emerald-400'} ${priorityMeta?.completedFill ?? 'bg-emerald-500'}` : `${priorityMeta?.circleBorder ?? 'border-gray-300'} ${priorityMeta?.circleFill ?? 'bg-transparent'}`
                    }`}
                    aria-label={task.is_completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {task.is_completed && (
                      <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Project</span>
                  <span className="text-sm font-medium text-gray-800">{task?.project?.name ?? 'Inbox'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close detail"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {task && (
                <TaskInlineEditor
                  task={task}
                  projects={projects}
                  onCancel={onClose}
                  onSave={async (updates) => {
                    await onUpdate(task.id, updates);
                    onClose();
                  }}
                />
              )}
            </div>

            {task && (
              <footer className="flex items-center justify-between border-t border-gray-100 bg-gray-50/80 px-5 py-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {onArchive && (
                    <button
                      type="button"
                      onClick={() => {
                        onArchive(task.id);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 hover:bg-gray-100"
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
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-rose-500 hover:bg-rose-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 0V4a1 1 0 011-1h2a1 1 0 011 1v3m-4 4v6m4-6v6" />
                    </svg>
                    Delete
                  </button>
                </div>
                <span className="text-xs text-gray-400">
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
