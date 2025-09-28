"use client";

import { Transition } from '@headlessui/react';
import React, {
  Fragment,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
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
  open: (anchorRect?: DOMRect) => void;
  close: () => void;
}

type PanelMode = 'popover' | 'sheet';

interface PanelLayout {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
}

const SHEET_BREAKPOINT = 768;
const MAX_POPOVER_WIDTH = 320;
const MAX_SHEET_WIDTH = 360;

const QuickScheduleMenu = forwardRef<QuickScheduleMenuHandle, QuickScheduleMenuProps>(function QuickScheduleMenu(
  { id, dueDate, deadlineAt, priority, onUpdate },
  ref
) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PanelMode>('popover');
  const [coords, setCoords] = useState<PanelLayout>({ left: 0, width: MAX_POPOVER_WIDTH });
  const [maxHeight, setMaxHeight] = useState(420);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const computeLayout = useCallback((anchorRect?: DOMRect | null) => {
    if (typeof window === 'undefined') return false;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 12;
    const panelWidth = Math.min(
      viewportWidth - margin * 2,
      viewportWidth < SHEET_BREAKPOINT ? MAX_SHEET_WIDTH : MAX_POPOVER_WIDTH
    );
    const estimatedHeight = 460;
    const nextMaxHeight = Math.min(estimatedHeight, viewportHeight - margin * 2);
    setMaxHeight(nextMaxHeight);

    if (viewportWidth < SHEET_BREAKPOINT) {
      setMode('sheet');
      setCoords({
        bottom: margin,
        left: Math.max(margin, (viewportWidth - panelWidth) / 2),
        width: panelWidth,
      });
      return true;
    }

    const fallbackRect = btnRef.current?.getBoundingClientRect();
    const anchor = anchorRect ?? fallbackRect;
    if (!anchor) return false;

    let top = anchor.bottom + margin;
    let left = anchor.left + anchor.width / 2 - panelWidth / 2;
    left = Math.max(margin, Math.min(left, viewportWidth - panelWidth - margin));

    if (top + nextMaxHeight > viewportHeight - margin) {
      const openUpTop = anchor.top - margin - nextMaxHeight;
      if (openUpTop >= margin) {
        top = openUpTop;
      } else {
        top = Math.max(margin, viewportHeight - nextMaxHeight - margin);
      }
    }

    setMode('popover');
    setCoords({ top, left, width: panelWidth });
    return true;
  }, []);

  const openMenu = useCallback((anchorRect?: DOMRect) => {
    if (!computeLayout(anchorRect)) return;
    setOpen(true);
  }, [computeLayout]);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setShowDatePicker(false);
    setShowDeadlinePicker(false);
  }, []);

  useImperativeHandle(ref, () => ({
    open: (anchorRect?: DOMRect) => openMenu(anchorRect),
    close: closeMenu,
  }), [closeMenu, openMenu]);

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

  const Panel = (
    <Transition
      as={Fragment}
      show={open}
      enter="transition ease-out duration-120"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-100"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <div
        data-testid="qs-menu"
        style={{
          position: 'fixed',
          top: mode === 'popover' ? coords.top : undefined,
          bottom: mode === 'sheet' ? coords.bottom : undefined,
          left: coords.left,
          width: coords.width,
          maxHeight,
          height: mode === 'sheet' ? maxHeight : undefined,
          zIndex: 99999,
        }}
        className={`flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none ${
          mode === 'sheet' ? 'rounded-3xl' : ''
        }`}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-4 py-3">
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Quick planner</span>
            <span className="text-sm text-gray-700">Adjust schedule & priority</span>
          </div>
          <button
            type="button"
            onClick={closeMenu}
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close quick planner"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
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
                    onClick={(event) => { event.preventDefault(); event.stopPropagation(); setPriorityLevel(value); }}
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
                    onClick={(event) => { event.preventDefault(); event.stopPropagation(); setDue(option.value); }}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
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
                <button
                  type="button"
                  className="text-xs text-gray-500"
                  onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); setShowDatePicker(false); }}
                  onClick={(event) => { event.preventDefault(); event.stopPropagation(); setShowDatePicker(false); }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-testid="qs-pick-date"
                onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); setShowDatePicker(true); }}
                onClick={(event) => { event.preventDefault(); event.stopPropagation(); setShowDatePicker(true); }}
                className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-2 text-left text-sm text-gray-600 hover:border-gray-400"
              >
                Pick a custom date
              </button>
            )}
            <button
              type="button"
              data-testid="qs-clear-due"
              onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); setDue(null); }}
              onClick={(event) => { event.preventDefault(); event.stopPropagation(); setDue(null); }}
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
                    onClick={(event) => { event.preventDefault(); event.stopPropagation(); setDeadline(option.value); }}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
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
                <button
                  type="button"
                  className="text-xs text-gray-500"
                  onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); setShowDeadlinePicker(false); }}
                  onClick={(event) => { event.preventDefault(); event.stopPropagation(); setShowDeadlinePicker(false); }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-testid="qs-set-deadline"
                onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); setShowDeadlinePicker(true); }}
                onClick={(event) => { event.preventDefault(); event.stopPropagation(); setShowDeadlinePicker(true); }}
                className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-2 text-left text-sm text-gray-600 hover:border-gray-400"
              >
                Pick a deadline
              </button>
            )}
            <button
              type="button"
              data-testid="qs-clear-deadline"
              onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); setDeadline(null); }}
              onClick={(event) => { event.preventDefault(); event.stopPropagation(); setDeadline(null); }}
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
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeMenu, open]);

  return (
    <div className="relative inline-block text-left">
      <button
        title="Quick schedule"
        ref={btnRef}
        className="rounded-md p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const rect = btnRef.current?.getBoundingClientRect();
          openMenu(rect ?? undefined);
        }}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
      {typeof window !== 'undefined' && open
        ? createPortal(
            <div
              onClick={closeMenu}
              onPointerDown={closeMenu}
              style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
            >
              <div className="absolute inset-0 bg-black/30" aria-hidden />
              {Panel}
            </div>,
            document.body
          )
        : null}
    </div>
  );
});

export default QuickScheduleMenu;
