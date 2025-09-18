"use client";
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Transition } from '@headlessui/react';

interface TaskActionMenuProps {
  id: string;
  title: string;
  onDelete?: (id: string) => void;
}

export default function TaskActionMenu({ id, title, onDelete }: TaskActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; openUp?: boolean }>({ top: 0, left: 0 });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const openMenu = () => {
    const el = btnRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuHeight = 140; const spaceBelow = window.innerHeight - rect.bottom; const openUp = spaceBelow < menuHeight;
    setCoords({ top: rect.bottom, left: Math.min(rect.left, window.innerWidth - 240), openUp });
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

  const copyLink = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#task-${id}`;
      await navigator.clipboard.writeText(url);
    } catch {}
    setOpen(false);
  };

  const Panel = (
    <Transition
      as={Fragment}
      show={open}
      enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95"
    >
      <div
        style={{ position: 'fixed', top: coords.openUp ? undefined : coords.top, bottom: coords.openUp ? Math.max(0, window.innerHeight - coords.top) : undefined, left: coords.left, zIndex: 99999 }}
        className="mt-2 w-60 rounded-lg bg-white shadow-lg ring-1 ring-black/5 divide-y divide-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          data-testid="action-copy"
          onClick={(e)=>{e.preventDefault(); e.stopPropagation(); copyLink();}}
          className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-100"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 14.828a4 4 0 010-5.656l1.586-1.586a4 4 0 015.656 5.656l-1.586 1.586M10.172 9.172a4 4 0 000 5.656l1.586 1.586a4 4 0 105.656-5.656l-1.414-1.414"/></svg>
          Copy link to task
          <span className="ml-auto text-xs text-gray-400">Shift+C</span>
        </button>
        <button
          type="button"
          data-testid="action-delete"
          onPointerDown={(e)=>{e.preventDefault(); e.stopPropagation();}}
          onClick={(e)=>{e.preventDefault(); e.stopPropagation(); setOpen(false); setConfirmOpen(true);}}
          className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
        >
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          Delete
          <span className="ml-auto text-xs text-gray-400">⌘⌫</span>
        </button>
      </div>
    </Transition>
  );

  return (
    <>
      <button
        ref={btnRef}
        title="More actions"
        className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        onPointerDown={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()} onTouchStart={(e)=>e.stopPropagation()}
        onClick={(e)=>{e.preventDefault(); e.stopPropagation(); openMenu();}}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 12a2 2 0 114 0 2 2 0 01-4 0zm5 0a2 2 0 114 0 2 2 0 01-4 0zm7-2a2 2 0 100 4 2 2 0 000-4z"/></svg>
      </button>
      {typeof window !== 'undefined' && open ? createPortal(
        <div onClick={()=>setOpen(false)} style={{ position:'fixed', inset:0, zIndex: 99998 }}>
          {Panel}
        </div>, document.body
      ) : null}

      {typeof window !== 'undefined' && confirmOpen ? createPortal(
        <div className="fixed inset-0 z-[2147483647]" role="dialog" aria-label="Delete task dialog" onClick={() => setConfirmOpen(false)}>
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
