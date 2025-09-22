"use client";

import { Transition } from '@headlessui/react';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Task, TaskUpdatePayload } from '@/lib/supabaseClient';

interface TaskDetailSheetProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: TaskUpdatePayload) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
}

const quadrantOptions: { value: Task['quadrant']; label: string; description: string }[] = [
  { value: 'urgent-important', label: 'Urgent · Important', description: 'Do first' },
  { value: 'not-urgent-important', label: 'Not urgent · Important', description: 'Schedule' },
  { value: 'urgent-not-important', label: 'Urgent · Not important', description: 'Delegate' },
  { value: 'not-urgent-not-important', label: 'Not urgent · Not important', description: 'Eliminate' },
];

const priorityOptions: { value: Task['priority_level']; label: string; badge: string; tone: string }[] = [
  { value: 'p1', label: 'P1 · Critical', badge: 'P1', tone: 'bg-rose-100 text-rose-700' },
  { value: 'p2', label: 'P2 · High', badge: 'P2', tone: 'bg-amber-100 text-amber-700' },
  { value: 'p3', label: 'P3 · Normal', badge: 'P3', tone: 'bg-blue-100 text-blue-700' },
  { value: 'p4', label: 'P4 · Low', badge: 'P4', tone: 'bg-slate-100 text-slate-600' },
];

const toISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (dateStr?: string | null) => {
  if (!dateStr) return 'Set date';
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, tomorrow)) return 'Tomorrow';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
};

type DateMenuType = 'due' | 'deadline';

interface DateMenuState {
  type: DateMenuType;
  coords: { top?: number; bottom?: number; left: number };
}

export default function TaskDetailSheet({ task, isOpen, onClose, onUpdate, onToggleComplete, onDelete, onArchive }: TaskDetailSheetProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [quadrant, setQuadrant] = useState<Task['quadrant']>('urgent-important');
  const [dueDate, setDueDate] = useState<string>('');
  const [deadlineAt, setDeadlineAt] = useState<string>('');
  const [priority, setPriority] = useState<Task['priority_level']>('p3');
  const [toast, setToast] = useState<string | null>(null);
  const [dateMenu, setDateMenu] = useState<DateMenuState | null>(null);

  const dueButtonRef = useRef<HTMLButtonElement | null>(null);
  const deadlineButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title ?? '');
    setNotes(task.notes ?? '');
    setQuadrant(task.quadrant);
    setDueDate(task.due_date || '');
    setDeadlineAt(task.deadline_at || '');
    setPriority(task.priority_level ?? 'p3');
  }, [task]);

  const hasChanges = useMemo(() => {
    if (!task) return false;
    return (
      title.trim() !== task.title.trim() ||
      (notes || '') !== (task.notes || '') ||
      quadrant !== task.quadrant ||
      priority !== (task.priority_level ?? 'p3') ||
      (dueDate || '') !== (task.due_date || '') ||
      (deadlineAt || '') !== (task.deadline_at || '')
    );
  }, [deadlineAt, dueDate, notes, quadrant, task, title, priority]);

  const handleSave = useCallback(() => {
    if (!task || !title.trim() || !hasChanges) {
      return;
    }
    const updates: TaskUpdatePayload = {};
    if (title.trim() !== task.title) updates.title = title.trim();
    if ((notes || '') !== (task.notes || '')) updates.notes = notes.trim() ? notes.trim() : null;
    if (quadrant !== task.quadrant) updates.quadrant = quadrant;
    if (priority !== (task.priority_level ?? 'p3')) updates.priority_level = priority;
    if ((dueDate || '') !== (task.due_date || '')) updates.due_date = dueDate || null;
    if ((deadlineAt || '') !== (task.deadline_at || '')) updates.deadline_at = deadlineAt || null;

    if (Object.keys(updates).length === 0) {
      return;
    }

    onUpdate(task.id, updates);
    setToast('Task updated');
  }, [deadlineAt, dueDate, hasChanges, notes, onUpdate, priority, quadrant, task, title]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (dateMenu) {
          setDateMenu(null);
          return;
        }
        onClose();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handleSave();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dateMenu, handleSave, isOpen, onClose]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timeout);
  }, [toast]);

  const openDateMenu = (type: DateMenuType) => {
    const anchor = type === 'due' ? dueButtonRef.current : deadlineButtonRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const menuWidth = 260;
    const menuHeight = 220;
    const margin = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const left = Math.min(Math.max(margin, rect.left), viewportWidth - menuWidth - margin);
    const openUp = viewportHeight - rect.bottom < menuHeight && rect.top > menuHeight;
    const coords = openUp
      ? { left, bottom: Math.max(margin, viewportHeight - rect.top + margin) }
      : { left, top: rect.bottom + margin };

    setDateMenu({ type, coords });
  };

  const applyQuickDate = (type: DateMenuType, value?: string | null) => {
    if (type === 'due') {
      setDueDate(value || '');
    } else {
      setDeadlineAt(value || '');
    }
    setDateMenu(null);
  };

  if (typeof window === 'undefined') return null;

  const quickDates = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    const nextWeek = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    nextWeek.setDate(today.getDate() + 7);
    return [
      { label: 'Today', value: toISODate(today), tone: 'text-emerald-700 bg-emerald-50' },
      { label: 'Tomorrow', value: toISODate(tomorrow), tone: 'text-amber-700 bg-amber-50' },
      { label: 'Next week', value: toISODate(nextWeek), tone: 'text-violet-700 bg-violet-50' },
    ];
  };

  const renderDateMenu = () => {
    if (!dateMenu) return null;
    const { type, coords } = dateMenu;
    const currentValue = type === 'due' ? dueDate : deadlineAt;

    return createPortal(
      <div
        onClick={() => setDateMenu(null)}
        onPointerDown={() => setDateMenu(null)}
        style={{ position: 'fixed', inset: 0, zIndex: 2147483642 }}
      >
        <div
          style={{
            position: 'fixed',
            top: coords.top,
            bottom: coords.bottom,
            left: coords.left,
            width: 260,
            zIndex: 2147483643,
          }}
          className="rounded-xl border border-gray-200 bg-white shadow-xl"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="p-3 space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {type === 'due' ? 'Set due date' : 'Set deadline'}
            </div>
            <div className="flex flex-wrap gap-2">
              {quickDates().map(({ label, value, tone }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => applyQuickDate(type, value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${tone} hover:brightness-95`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-2 space-y-2">
              <label className="text-xs font-medium text-gray-500">Pick a date</label>
              <input
                type="date"
                value={currentValue}
                onChange={(event) => applyQuickDate(type, event.target.value || undefined)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => applyQuickDate(type, null)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Clear date
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const renderToast = () => {
    if (!toast) return null;
    return createPortal(
      <div className="fixed bottom-8 left-1/2 z-[2147483647] -translate-x-1/2">
        <div className="rounded-full bg-gray-900/90 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      </div>,
      document.body
    );
  };

  const metaInfo = task
    ? `Created ${new Date(task.created_at).toLocaleString()} · Last updated ${task.updated_at ? new Date(task.updated_at).toLocaleString() : '—'}`
    : '';

  return (
    <>
      <Transition show={isOpen} as={Fragment} appear>
        <div
          className="fixed inset-0 z-[2147483646]"
          role="dialog"
          aria-modal="true"
          onClick={onClose}
          onPointerDown={onClose}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-out duration-150"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="absolute inset-0 bg-black/40" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="translate-y-full"
            enterTo="translate-y-0"
            leave="transition ease-in duration-200"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-full"
          >
            <div
              className="absolute inset-0 flex items-end justify-center p-4 sm:p-6"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="w-full max-w-xl rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
                <div className="px-6 pt-5">
                  <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-gray-300" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border ${task?.is_completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 text-transparent'}`}
                        onClick={() => task && onToggleComplete(task.id)}
                        aria-label={task?.is_completed ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {task?.is_completed && (
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <input
                        className="w-full flex-1 border-none bg-transparent text-lg font-semibold text-gray-900 focus:outline-none focus:ring-0"
                        placeholder="Task title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        autoFocus
                      />
                    </div>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600"
                      onClick={onClose}
                      aria-label="Close task details"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-4 px-6 pb-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase text-gray-500">Quadrant</span>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-1">
                        {quadrantOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setQuadrant(option.value)}
                            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                              quadrant === option.value
                                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                : 'border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex flex-col text-left">
                              <span className="font-medium">{option.label}</span>
                              <span className="text-xs text-gray-500">{option.description}</span>
                            </div>
                            {quadrant === option.value && (
                              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase text-gray-500">Priority</span>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                        {priorityOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setPriority(option.value)}
                            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                              priority === option.value
                                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                : 'border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <span>{option.label}</span>
                            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${option.tone}`}>
                              {option.badge}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase text-gray-500">Due date</span>
                      <button
                        ref={dueButtonRef}
                        type="button"
                        onClick={() => openDateMenu('due')}
                        className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 hover:border-blue-400 focus:border-blue-500 focus:outline-none"
                      >
                        <span>{formatDateForDisplay(dueDate)}</span>
                        <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase text-gray-500">Deadline</span>
                      <button
                        ref={deadlineButtonRef}
                        type="button"
                        onClick={() => openDateMenu('deadline')}
                        className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 hover:border-blue-400 focus:border-blue-500 focus:outline-none"
                      >
                        <span>{formatDateForDisplay(deadlineAt)}</span>
                        <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <label className="flex flex-col gap-2 text-sm font-medium text-gray-600">
                    <span className="text-xs font-semibold uppercase text-gray-500">Notes</span>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      rows={4}
                      placeholder="Add context, links, or next steps"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
                    />
                  </label>

                  {task?.created_at && (
                    <div className="text-right text-xs text-gray-400">{metaInfo}</div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/80 px-6 py-4">
                  <div className="flex items-center gap-4 text-sm font-medium">
                    {onArchive && (
                      <button
                        type="button"
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                        onClick={() => {
                          if (!task) return;
                          onClose();
                          onArchive(task.id);
                        }}
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
                      className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (!task) return;
                        onClose();
                        onDelete(task.id);
                      }}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v2" />
                      </svg>
                      Delete
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                      onClick={handleSave}
                      disabled={!task || !title.trim() || !hasChanges}
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Transition>
      {renderDateMenu()}
      {renderToast()}
    </>
  );
}
