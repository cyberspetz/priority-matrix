'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface QuadrantInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quadrantId: string;
  title: string;
  description: string;
}

const quadrantInfo = {
  'urgent-important': {
    title: 'FIRES',
    subtitle: 'these are issues you have to DO NOW!',
    examples: ['catastrophes', 'deadlines', 'emergencies'],
    description: "These hard-to-plan-for tasks are often unexpected and need to be dealt with as soon as possible. Don't worry though, you've got this."
  },
  'not-urgent-important': {
    title: 'PRIORITIZE',
    subtitle: 'put the things that you should be working on here',
    examples: ['preparations', 'relationships', 'development'],
    description: 'These tasks are required for company growth. Spend most of your time here proactively.'
  },
  'urgent-not-important': {
    title: 'REDUCE',
    subtitle: 'let these take the backburner, or delegate them out',
    examples: ['interruptions', '(most) emails', '(many) meetings'],
    description: 'These small interruptions cause large rifts in your productivity. Spend less time here and delegate them out using Priority Matrix.'
  },
  'not-urgent-not-important': {
    title: 'REPOSITORY',
    subtitle: 'put every other tasks or ideas here first',
    examples: ['ideas', 'brainstorm', 'low priority items'],
    description: "Don't let LIFO (last in, first out) stifle your productivity. Use this quadrant to track your ideas, and when the time is right, move them into the proper buckets."
  }
};

export default function QuadrantInfoDialog({ isOpen, onClose, quadrantId }: QuadrantInfoDialogProps) {
  const info = quadrantInfo[quadrantId as keyof typeof quadrantInfo];

  if (!info) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl p-6 text-left align-middle shadow-xl transition-all border border-gray-200/50">
                <div className="flex items-start justify-between">
                  <div>
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-bold text-gray-900 uppercase tracking-wide"
                    >
                      {info.title}
                    </Dialog.Title>
                    <p className="text-sm text-gray-600 mt-1 mb-3">
                      {info.subtitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4">
                  <ul className="space-y-1 mb-4">
                    {info.examples.map((example, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-700">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                        {example}
                      </li>
                    ))}
                  </ul>

                  <p className="text-sm text-gray-600 leading-relaxed">
                    {info.description}
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}