"use client";
import React, { useState } from 'react';

type QuadrantId = 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';

interface SmartPriorityPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuadrant: (quadrantId: QuadrantId) => void;
}

interface QuadrantOption {
  id: QuadrantId;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  borderColor: string;
  examples: string[];
}

const QUADRANT_OPTIONS: QuadrantOption[] = [
  {
    id: 'urgent-important',
    title: 'Do First',
    subtitle: 'Urgent & Important',
    emoji: '🔥',
    color: 'bg-emerald-500',
    borderColor: 'border-emerald-500',
    examples: ['Crises', 'Deadlines', 'Emergencies'],
  },
  {
    id: 'not-urgent-important',
    title: 'Schedule',
    subtitle: 'Important, Not Urgent',
    emoji: '📅',
    color: 'bg-sky-500',
    borderColor: 'border-sky-500',
    examples: ['Planning', 'Learning', 'Relationships'],
  },
  {
    id: 'urgent-not-important',
    title: 'Delegate',
    subtitle: 'Urgent, Not Important',
    emoji: '👥',
    color: 'bg-amber-500',
    borderColor: 'border-amber-500',
    examples: ['Interruptions', 'Some emails', 'Some calls'],
  },
  {
    id: 'not-urgent-not-important',
    title: 'Eliminate',
    subtitle: 'Neither Urgent nor Important',
    emoji: '🗑️',
    color: 'bg-slate-500',
    borderColor: 'border-slate-500',
    examples: ['Time wasters', 'Busy work', 'Distractions'],
  },
];

export default function SmartPriorityPicker({ isOpen, onClose, onSelectQuadrant }: SmartPriorityPickerProps) {
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantId | null>(null);

  const handleSelect = (quadrantId: QuadrantId) => {
    setSelectedQuadrant(quadrantId);
    // Small delay for visual feedback
    setTimeout(() => {
      onSelectQuadrant(quadrantId);
      setSelectedQuadrant(null);
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div
          className="rounded-t-3xl border-t-2 max-h-[85vh] overflow-y-auto"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border-strong)',
          }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 rounded-full" style={{ background: 'var(--color-border-strong)' }} />
          </div>

          {/* Header */}
          <div className="px-6 pt-2 pb-4">
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-900)' }}>
              Choose Priority
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Where does this task belong?
            </p>
          </div>

          {/* Decision Helper */}
          <div className="px-6 pb-4">
            <div className="rounded-xl p-4 border" style={{ background: 'var(--color-surface-muted)', borderColor: 'var(--color-border)' }}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-muted)' }}>
                Quick Guide
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="font-semibold mb-1" style={{ color: 'var(--color-text-700)' }}>Is it urgent?</div>
                  <div style={{ color: 'var(--color-text-muted)' }}>Needs immediate attention</div>
                </div>
                <div>
                  <div className="font-semibold mb-1" style={{ color: 'var(--color-text-700)' }}>Is it important?</div>
                  <div style={{ color: 'var(--color-text-muted)' }}>Contributes to goals</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quadrant Options - 2x2 Grid */}
          <div className="px-4 pb-6">
            <div className="grid grid-cols-2 gap-3">
              {QUADRANT_OPTIONS.map((quadrant) => (
                <button
                  key={quadrant.id}
                  onClick={() => handleSelect(quadrant.id)}
                  className={`relative rounded-2xl border-3 p-4 text-left transition-all active:scale-95 ${
                    selectedQuadrant === quadrant.id ? 'scale-95' : ''
                  }`}
                  style={{
                    background: 'var(--color-surface-elevated)',
                    borderColor: selectedQuadrant === quadrant.id ? quadrant.color.replace('bg-', '') : 'var(--color-border)',
                    minHeight: '140px',
                  }}
                >
                  {/* Emoji */}
                  <div className="text-3xl mb-2">{quadrant.emoji}</div>

                  {/* Title */}
                  <div className="font-bold text-base mb-0.5" style={{ color: 'var(--color-text-900)' }}>
                    {quadrant.title}
                  </div>

                  {/* Subtitle */}
                  <div className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    {quadrant.subtitle}
                  </div>

                  {/* Examples */}
                  <div className="space-y-1">
                    {quadrant.examples.slice(0, 2).map((example, i) => (
                      <div
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded inline-block mr-1"
                        style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-500)' }}
                      >
                        {example}
                      </div>
                    ))}
                  </div>

                  {/* Accent indicator */}
                  <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${quadrant.color}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Cancel Button */}
          <div className="px-6 pb-8">
            <button
              onClick={onClose}
              className="w-full py-4 rounded-xl font-semibold transition-all active:scale-98"
              style={{
                background: 'var(--color-surface-muted)',
                color: 'var(--color-text-700)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </>
  );
}
