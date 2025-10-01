"use client";
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Transition } from '@headlessui/react';

interface TaskActionMenuProps {
  id: string;
  title: string;
  onArchive?: (id: string) => void;
  onOpenDetail?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function TaskActionMenu({ id, title, onArchive, onOpenDetail, onDelete }: TaskActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number; openUp?: boolean; width?: number }>({ left: 0, top: 0 });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const openMenu = () => {
    const el = btnRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuWidth = 240;
    const menuHeight = 140;
    const margin = 8;
    const viewportWidth = window.innerWidth;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight && rect.top > menuHeight;
    const maxLeft = Math.max(margin, viewportWidth - menuWidth - margin);
    const left = Math.min(Math.max(margin, rect.left + rect.width - menuWidth), maxLeft);
        const width = rect.width;

    if (openUp) {
      const bottom = Math.max(margin, window.innerHeight - rect.top + margin);
      setCoords({ bottom, left, openUp: true, width });
    } else {
      const top = Math.max(margin, rect.bottom + margin);
      setCoords({ top, left, openUp: false, width });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setConfirmOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmOpen]);

  const panelStyle = {
    position: 'fixed' as const,
    left: Math.min(Math.max(8, coords.left + (coords.width ?? 0) - 240), window.innerWidth - 248),
    top: coords.openUp ? undefined : coords.top,
    bottom: coords.openUp ? coords.bottom : undefined,
    zIndex: 99999,
    background: 'var(--color-surface)',
    boxShadow: 'var(--shadow-soft)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-700)'
  };

  const Panel = (
    <Transition
      as={Fragment}
      show={open}
      enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95"
    >
      <div style={panelStyle} className="w-60 rounded-lg" onPointerDown={(e) => { e.stopPropagation(); }} onClick={(e) => e.stopPropagation()}>
        {onOpenDetail && (
          <button
            type="button"
            data-testid="action-open-detail"
            onPointerDown={(e)=>{e.preventDefault(); e.stopPropagation();}}
            onClick={(e)=>{
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              onOpenDetail(id);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition"
            style={{ color: 'var(--color-text-700)' }}
          >
            <svg className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 010 5.292M15 21H9a2 2 0 01-2-2v-1a4 4 0 014-4h2a4 4 0 014 4v1a2 2 0 01-2 2zm-3-9a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
            Edit details
          </button>
        )}
        {onArchive && (
          <button
            type="button"
            data-testid="action-archive"
            onPointerDown={(e)=>{e.preventDefault(); e.stopPropagation();}}
            onClick={(e)=>{
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              onArchive?.(id);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition"
            style={{ color: 'var(--color-text-700)' }}
          >
            <svg className="w-4 h-4" style={{ color: 'var(--color-warning)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16V8.828A2 2 0 0019.414 7L14 1.586A2 2 0 0012.586 1H6a2 2 0 00-2 2z" />
            </svg>
            Archive task
          </button>
        )}
        <button
          type="button"
          data-testid="action-delete"
          onPointerDown={(e)=>{e.preventDefault(); e.stopPropagation();}}
          onClick={(e)=>{e.preventDefault(); e.stopPropagation(); setOpen(false); setConfirmOpen(true);}}
          className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm"
          style={{ color: 'var(--color-danger)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          Delete
          <span className="ml-auto text-xs" style={{ color: 'var(--color-text-muted)' }}>⌘⌫</span>
        </button>
      </div>
    </Transition>
  );

  return (
    <>
      <button
        ref={btnRef}
        title="More actions"
        className="p-1.5 rounded-md transition"
        style={{ color: 'var(--color-text-muted)' }}
        onPointerDown={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()} onTouchStart={(e)=>e.stopPropagation()}
        onClick={(e)=>{e.preventDefault(); e.stopPropagation(); openMenu();}}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 12a2 2 0 114 0 2 2 0 01-4 0zm5 0a2 2 0 114 0 2 2 0 01-4 0zm7-2a2 2 0 100 4 2 2 0 000-4z"/></svg>
      </button>
      {typeof window !== 'undefined' && open ? createPortal(
        <div
          onClick={()=>setOpen(false)}
          onPointerDown={()=>setOpen(false)}
          style={{ position:'fixed', inset:0, zIndex: 99998 }}
        >
          {Panel}
        </div>, document.body
      ) : null}

      {typeof window !== 'undefined' && confirmOpen ? createPortal(
        <div
          className="fixed inset-0 z-[2147483647]"
          role="dialog"
          aria-label="Delete task dialog"
          onClick={() => setConfirmOpen(false)}
          onPointerDown={() => setConfirmOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex min-h-full items-center justify-center p-4" onClick={(e)=>e.stopPropagation()} onPointerDown={(e)=>e.stopPropagation()}>
            <div className="relative w-full max-w-md rounded-xl bg-white p-6 text-left align-middle shadow-xl">
              <button
                type="button"
                aria-label="Close delete dialog"
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                onPointerDown={(e)=>{e.preventDefault(); e.stopPropagation();}}
                onClick={(e)=>{e.preventDefault(); setConfirmOpen(false);}}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="text-lg font-semibold text-gray-900">Delete task?</div>
              <p className="mt-2 text-sm text-gray-600">The <span className="font-medium text-gray-900">{title}</span> task will be permanently deleted.</p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  data-testid="confirm-cancel"
                  type="button"
                  onPointerDown={(e)=>{e.preventDefault(); e.stopPropagation();}}
                  onClick={(e)=>{e.preventDefault(); setConfirmOpen(false);}}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  data-testid="confirm-delete"
                  type="button"
                  onPointerDown={(e)=>{e.preventDefault(); e.stopPropagation();}}
                  onClick={(e)=>{e.preventDefault(); setConfirmOpen(false); onDelete?.(id);}}
                  className="px-4 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>, document.body
      ) : null}
    </>
  );
}
