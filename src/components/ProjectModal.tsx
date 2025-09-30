"use client";

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import type { Project, ProjectLayout } from '@/lib/supabaseClient';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: { name: string; color?: string | null; layout: ProjectLayout }) => Promise<Project>;
}

const COLORS: { label: string; value: string | null; swatch: string }[] = [
  { label: 'Charcoal', value: 'charcoal', swatch: 'bg-slate-700' },
  { label: 'Tomato', value: 'tomato', swatch: 'bg-rose-500' },
  { label: 'Sunflower', value: 'sunflower', swatch: 'bg-amber-400' },
  { label: 'Ocean', value: 'ocean', swatch: 'bg-sky-500' },
  { label: 'Forest', value: 'forest', swatch: 'bg-emerald-500' },
  { label: 'Grape', value: 'grape', swatch: 'bg-violet-500' },
];

const LAYOUTS: { label: string; value: ProjectLayout; description: string }[] = [
  { label: 'Board', value: 'board', description: 'Use quadrants to prioritize' },
  { label: 'List', value: 'list', description: 'Simple list of tasks' },
  { label: 'Calendar', value: 'calendar', description: 'Plan tasks on a timeline' },
];

export default function ProjectModal({ isOpen, onClose, onSubmit }: ProjectModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState<string | null>('charcoal');
  const [layout, setLayout] = useState<ProjectLayout>('board');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setColor('charcoal');
    setLayout('board');
    setError(null);
  };

  const handleClose = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a project name.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await onSubmit({ name: name.trim(), color, layout });
      reset();
      onClose();
    } catch (submitError) {
      console.error('Failed to create project:', submitError);
      setError('Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment} appear>
      <Dialog as="div" className="relative z-[2147483647]" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-2 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-2 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                <div className="border-b border-gray-100 px-6 py-4">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">Add project</Dialog.Title>
                  <p className="text-sm text-gray-500">Organize related tasks into focused spaces.</p>
                </div>
                <div className="space-y-5 px-6 py-5">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Name</label>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={120}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
                      placeholder="e.g. Personal Errands"
                      autoFocus
                    />
                    <div className="mt-1 text-right text-[11px] text-gray-400">{name.length}/120</div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Color</span>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {COLORS.map(option => (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => setColor(option.value)}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                            color === option.value ? 'border-gray-900 text-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <span className={`h-3 w-3 rounded-full ${option.swatch}`}></span>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Layout</span>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {LAYOUTS.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setLayout(option.value)}
                          className={`rounded-lg border px-3 py-2 text-left text-sm ${
                            layout === option.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">{option.label}</div>
                          <div className="text-[11px] text-gray-500">{option.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 bg-gray-50">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving}
                    className="rounded-full bg-rose-500 px-5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
                  >
                    {saving ? 'Adding…' : 'Add project'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
