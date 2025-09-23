"use client";
import React from 'react';
import { usePasswordProtection } from './PasswordProtection';

type View = 'inbox' | 'today' | 'upcoming';

interface SidebarNavProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (view: View) => void;
  onAddTask: () => void;
  counts: { inbox: number; today: number; upcoming: number };
}

export default function SidebarNav({ isOpen, onClose, onSelect, onAddTask, counts }: SidebarNavProps) {
  const { logout } = usePasswordProtection();
  const NavItem: React.FC<{ icon: React.ReactNode; label: string; count?: number; onClick: () => void }> = ({ icon, label, count, onClick }) => (
    <button
      onClick={() => { onClick(); onClose(); }}
      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-800"
    >
      <span className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </span>
      {typeof count === 'number' && count > 0 && (
        <span className="text-xs text-gray-600">{count}</span>
      )}
    </button>
  );

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} md:hidden`}
        onClick={onClose}
        onPointerDown={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 shadow-xl transform transition-transform duration-300 z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500" />
            <div className="text-sm font-semibold text-gray-800">Menu</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-2">
          <button
            onClick={() => { onAddTask(); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
            </svg>
            Add task
          </button>

          <div className="pt-2 space-y-1">
            <NavItem
              icon={<svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" /></svg>}
              label="Inbox"
              count={counts.inbox}
              onClick={() => onSelect('inbox')}
            />
            <NavItem
              icon={<svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              label="Today"
              count={counts.today}
              onClick={() => onSelect('today')}
            />
            <NavItem
              icon={<svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3v6h6v-6c0-1.657-1.343-3-3-3z" /></svg>}
              label="Upcoming"
              count={counts.upcoming}
              onClick={() => onSelect('upcoming')}
            />
          </div>

          <div className="pt-4 mt-6 border-t border-gray-100">
            <button
              onClick={() => { logout(); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
              </svg>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
