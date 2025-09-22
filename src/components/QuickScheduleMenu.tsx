"use client";
import { Transition } from '@headlessui/react';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TaskUpdatePayload } from '@/lib/supabaseClient';

interface QuickScheduleMenuProps {
  id: string;
  dueDate?: string;
  deadlineAt?: string;
  onUpdate: (id: string, updates: TaskUpdatePayload) => void;
}

export default function QuickScheduleMenu({ id, dueDate, deadlineAt, onUpdate }: QuickScheduleMenuProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number; openUp?: boolean }>({ left: 0, top: 0 });
  const btnRef = useRef<HTMLButtonElement | null>(null);

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
    setOpen(false);
  };

  const setDeadline = (value?: string | null) => {
    if (value === null) {
      onUpdate(id, { deadline_at: null });
    } else if (value) {
      onUpdate(id, { deadline_at: value });
    }
    setOpen(false);
  };

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

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
        className="w-56 origin-top-right divide-y divide-gray-100 rounded-lg bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
        onPointerDown={(e) => { e.stopPropagation(); }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-2">
          <button data-testid="qs-today" onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation(); setDue(localDateString(today));}} className={'w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm text-emerald-700 hover:bg-gray-100'}>
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Today
          </button>
          <button data-testid="qs-tomorrow" onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation(); setDue(localDateString(tomorrow));}} className={'w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm text-amber-700 hover:bg-gray-100'}>
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Tomorrow
          </button>
          <button data-testid="qs-next-week" onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation(); setDue(localDateString(nextWeek));}} className={'w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm text-violet-700 hover:bg-gray-100'}>
            <span className="w-2 h-2 rounded-full bg-violet-400" /> Next week
          </button>
          <button data-testid="qs-clear-due" onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation(); setDue(null);}} className={'w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100'}>
            <span className="w-2 h-2 rounded-full bg-gray-300" /> Clear due date
          </button>
        </div>
        <div className="p-2">
          <button
            data-testid="qs-pick-date"
            onMouseDown={(e) => { e.preventDefault(); setShowDatePicker(s => !s); }}
            onClick={(e) => e.preventDefault()}
            className={'w-full text-left px-3 py-2 rounded-md text-sm text-gray-800 hover:bg-gray-100'}
          >
            📅 Pick date
          </button>
          {showDatePicker && (
            <div className="px-3 pb-2">
              <input type="date" className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm" value={dueDate || ''} onChange={(e) => { setDue(e.target.value); setOpen(false); }} />
            </div>
          )}
        </div>
        <div className="p-2">
          <button
            data-testid="qs-set-deadline"
            onMouseDown={(e) => { e.preventDefault(); setShowDeadlinePicker(s => !s); }}
            onClick={(e) => e.preventDefault()}
            className={'w-full text-left px-3 py-2 rounded-md text-sm text-gray-800 hover:bg-gray-100'}
          >
            ⏰ Set deadline
          </button>
          {showDeadlinePicker && (
            <div className="px-3 pb-2">
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                value={deadlineAt || ''}
                onChange={(e) => { setDeadline(e.target.value); }}
              />
            </div>
          )}
          <button data-testid="qs-clear-deadline" onClick={() => { setDeadline(null); setOpen(false); }} className={'w-full text-left px-3 py-2 rounded-md text-sm text-gray-800 hover:bg-gray-100'}>Remove deadline</button>
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

  const openMenu = () => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuWidth = 224;
    const menuHeight = 320;
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
  };

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
          onClick={() => setOpen(false)}
          onPointerDown={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
        >
          {Panel}
        </div>,
        document.body
      ) : null}
    </div>
  );
}
