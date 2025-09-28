"use client";
import { Transition } from '@headlessui/react';
import React, { Fragment, forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TaskPriority, TaskUpdatePayload } from '@/lib/supabaseClient';
import { getPriorityMeta, PRIORITY_ORDER } from '@/lib/priority';

interface QuickScheduleMenuProps {
  id: string;
  dueDate?: string;
  deadlineAt?: string;
  priority: TaskPriority;
  onUpdate: (id: string, updates: TaskUpdatePayload) => void;
}

export interface QuickScheduleMenuHandle {
  open: () => void;
  close: () => void;
}

const QuickScheduleMenu = forwardRef<QuickScheduleMenuHandle, QuickScheduleMenuProps>(function QuickScheduleMenu(
  { id, dueDate, deadlineAt, priority, onUpdate },
  ref
) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number; openUp?: boolean }>({ left: 0, top: 0 });
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const openMenu = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuWidth = 280;
    const menuHeight = 420;
    const margin = 8;
    const viewportWidth = window.innerWidth;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight && rect.top > menuHeight;
    const maxLeft = Math.max(margin, viewportWidth - menuWidth - margin);
    const left = Math.min(Math.max(margin, rect.left), maxLeft);

    if (openUp) {
      const bottom = Math.max(margin, window.innerHeight - rect.top + margin);
      setCoords({ bottom, left, openUp: true });
    } else {
      const top = Math.max(margin, rect.bottom + margin);
      setCoords({ top, left, openUp: false });
    }
    setOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  useImperativeHandle(ref, () => ({
    open: openMenu,
    close: closeMenu,
  }), [openMenu, closeMenu]);

  const localDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const setDue = (dateStr?: string | null) => {
    if (dateStr === null) {
      onUpdate(id, { due_date: null });
    } else if (dateStr) {
      onUpdate(id, { due_date: dateStr });
    }
    setShowDatePicker(false);
    closeMenu();
  };

  const setDeadline = (value?: string | null) => {
    if (value === null) {
      onUpdate(id, { deadline_at: null });
    } else if (value) {
      onUpdate(id, { deadline_at: value });
    }
    setShowDeadlinePicker(false);
    closeMenu();
  };

  const setPriorityLevel = (value: TaskPriority) => {
    onUpdate(id, { priority_level: value });
    closeMenu();
  };

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  const inTwoWeeks = new Date(today);
  inTwoWeeks.setDate(today.getDate() + 14);

  const normalizedDue = dueDate ? dueDate.split('T')[0] : undefined;
  const normalizedDeadline = deadlineAt ? deadlineAt.split('T')[0] : undefined;

  const endOfWeek = new Date(today);
  const dayOfWeek = today.getDay();
  const daysUntilSaturday = ((6 - dayOfWeek) + 7) % 7 || 7;
  endOfWeek.setDate(today.getDate() + daysUntilSaturday);

  const nextMonday = new Date(today);
  const daysUntilMonday = ((8 - dayOfWeek) % 7) || 7;
  nextMonday.setDate(today.getDate() + daysUntilMonday);

  const scheduleOptions = [
    {
      key: 'today',
      label: 'Today',
      caption: 'Start right away',
      value: localDateString(today),
      testId: 'qs-today',
      icon: (
        <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: 'tomorrow',
      label: 'Tomorrow',
      caption: 'Queue for the next day',
      value: localDateString(tomorrow),
      testId: 'qs-tomorrow',
      icon: (
        <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v5m0 8v5m7-7h-5m-4 0H5m13.657-6.657l-3.536 3.536M8.343 15.657l-3.536 3.536m0-11.314l3.536 3.536m11.314 7.778l-3.536-3.536" />
        </svg>
      ),
    },
    {
      key: 'next-week',
      label: 'Next week',
      caption: 'Plan a fresh start',
      value: localDateString(nextWeek),
      testId: 'qs-next-week',
      icon: (
        <svg className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
  ];

  const deadlineOptions = [
    {
      key: 'weekend',
      label: 'End of week',
      caption: 'Wrap before the weekend',
      value: localDateString(endOfWeek),
      icon: (
        <svg className="h-4 w-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m5-3a9 9 0 11-9-9" />
        </svg>
      ),
    },
    {
      key: 'next-monday',
      label: 'Next Monday',
      caption: 'First thing next week',
      value: localDateString(nextMonday),
      icon: (
        <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    {
      key: 'two-weeks',
      label: 'In two weeks',
      caption: 'Give yourself extra runway',
      value: localDateString(inTwoWeeks),
      icon: (
        <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m0 0l3-3m-3 3l-3-3m11-4a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  // Portal content
  const Panel = (
    <Transition
      as={Fragment}
      show={open}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <div
        data-testid="qs-menu"
        style={{
          position: 'fixed',
          top: coords.openUp ? undefined : coords.top,
          bottom: coords.openUp ? coords.bottom : undefined,
          left: coords.left,
          zIndex: 99999,
        }}
        className="w-[280px] rounded-xl border border-gray-100 bg-white shadow-xl ring-1 ring-black/5 focus:outline-none"
        onPointerDown={(e) => { e.stopPropagation(); }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 space-y-4">
          <section className="space-y-2">
            <div className="text-xs font-semibold uppercase text-gray-500">Priority</div>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_ORDER.map(value => {
                const meta = getPriorityMeta(value);
                const isActive = priority === value;
                return (
                  <button
                    key={value}
                    type="button"
                    data-testid={`qs-priority-${value}`}
                    onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); setPriorityLevel(value); }}
                    className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition ${
                      isActive ? `${meta.pillTone} shadow-sm` : 'border border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                    aria-pressed={isActive}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${meta.dotFill}`} aria-hidden />
                    <span>{meta.flagLabel}</span>
                    <span className="text-[11px] text-gray-500">{meta.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <div className="text-xs font-semibold uppercase text-gray-500">Schedule</div>
              <p className="text-[11px] text-gray-500">Plan when you want to begin.</p>
            </div>
            <div className="space-y-2">
              {scheduleOptions.map(option => {
                const isActive = normalizedDue === option.value;
                return (
                  <button
                    key={option.key}
                    type="button"
                    data-testid={option.testId}
                    onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); setDue(option.value); }}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                      isActive ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="rounded-lg bg-gray-100 p-1.5" aria-hidden>
                        {option.icon}
                      </span>
                      <span className="flex flex-col">
                        <span className="text-sm font-medium">{option.label}</span>
                        <span className="text-xs text-gray-500">{option.caption}</span>
                      </span>
                    </span>
                    {isActive && (
                      <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            {showDatePicker ? (
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                <input
                  type="date"
                  className="w-full border-none bg-transparent text-sm text-gray-700 focus:outline-none"
                  value={normalizedDue || ''}
                  onChange={(event) => {
                    event.stopPropagation();
                    const value = event.target.value;
                    if (value) {
                      setDue(value);
                    }
                  }}
                />
                <button type="button" className="text-xs text-gray-500" onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); setShowDatePicker(false); }}>
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-testid="qs-pick-date"
                onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); setShowDatePicker(true); }}
                className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-2 text-left text-sm text-gray-600 hover:border-gray-400"
              >
                Pick a custom date
              </button>
            )}
            <button
              type="button"
              data-testid="qs-clear-due"
              onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); setDue(null); }}
              className="w-full text-left text-xs font-medium text-gray-600 hover:text-gray-800"
            >
              Clear schedule
            </button>
          </section>

          <section className="space-y-3">
            <div>
              <div className="text-xs font-semibold uppercase text-gray-500">Deadline</div>
              <p className="text-[11px] text-gray-500">The latest acceptable finish date.</p>
            </div>
            <div className="space-y-2">
              {deadlineOptions.map(option => {
                const isActive = normalizedDeadline === option.value;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); setDeadline(option.value); }}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                      isActive ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="rounded-lg bg-gray-100 p-1.5" aria-hidden>
                        {option.icon}
                      </span>
                      <span className="flex flex-col">
                        <span className="text-sm font-medium">{option.label}</span>
                        <span className="text-xs text-gray-500">{option.caption}</span>
                      </span>
                    </span>
                    {isActive && (
                      <svg className="h-4 w-4 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            {showDeadlinePicker ? (
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                <input
                  type="date"
                  className="w-full border-none bg-transparent text-sm text-gray-700 focus:outline-none"
                  value={normalizedDeadline || ''}
                  onChange={(event) => {
                    event.stopPropagation();
                    const value = event.target.value;
                    if (value) {
                      setDeadline(value);
                    }
                  }}
                />
                <button type="button" className="text-xs text-gray-500" onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); setShowDeadlinePicker(false); }}>
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-testid="qs-set-deadline"
                onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); setShowDeadlinePicker(true); }}
                className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-2 text-left text-sm text-gray-600 hover:border-gray-400"
              >
                Pick a deadline
              </button>
            )}
            <button
              type="button"
              data-testid="qs-clear-deadline"
              onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); setDeadline(null); }}
              className="w-full text-left text-xs font-medium text-gray-600 hover:text-gray-800"
            >
              Remove deadline
            </button>
          </section>

        </div>
      </div>
    </Transition>
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div className="relative inline-block text-left">
      <button
        title="Quick schedule"
        ref={btnRef}
        className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openMenu(); }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
      {typeof window !== 'undefined' && open ? createPortal(
        <div
          onClick={closeMenu}
          onPointerDown={closeMenu}
          style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
        >
          {Panel}
        </div>,
        document.body
      ) : null}
    </div>
  );
});

export default QuickScheduleMenu;
