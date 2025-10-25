"use client";
import React, { useState } from 'react';
import TaskCard from './TaskCard';
import type { Task, Project, TaskUpdatePayload } from '@/lib/supabaseClient';

interface QuadrantData {
  id: string;
  title: string;
  description: string;
  emoji: string;
  accentColor: string;
  tasks: Task[];
}

interface MobileQuadrantListProps {
  quadrants: QuadrantData[];
  onDeleteTask?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
  onUpdateTask?: (id: string, updates: TaskUpdatePayload) => void;
  onOpenDetail?: (id: string) => void;
  onArchiveTask?: (id: string) => void;
  onViewQuadrant: (quadrantId: string) => void;
  projects: Project[];
  editingTaskId?: string | null;
  onEnterEdit?: (id: string) => void;
  onExitEdit?: () => void;
}

const QUADRANT_COLORS = {
  'urgent-important': {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    accent: 'bg-emerald-500',
  },
  'not-urgent-important': {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-700',
    accent: 'bg-sky-500',
  },
  'urgent-not-important': {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    accent: 'bg-amber-500',
  },
  'not-urgent-not-important': {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-700',
    accent: 'bg-slate-500',
  },
};

export default function MobileQuadrantList({
  quadrants,
  onDeleteTask,
  onToggleComplete,
  onUpdateTask,
  onOpenDetail,
  onArchiveTask,
  onViewQuadrant,
  projects,
  editingTaskId,
  onEnterEdit,
  onExitEdit,
}: MobileQuadrantListProps) {
  const [expandedQuadrants, setExpandedQuadrants] = useState<Set<string>>(
    new Set(['urgent-important']) // Do First expanded by default
  );

  const toggleQuadrant = (quadrantId: string) => {
    setExpandedQuadrants(prev => {
      const next = new Set(prev);
      if (next.has(quadrantId)) {
        next.delete(quadrantId);
      } else {
        next.add(quadrantId);
      }
      return next;
    });
  };

  const MAX_PREVIEW_TASKS = 7;

  return (
    <div className="space-y-4">
      {quadrants.map((quadrant) => {
        const isExpanded = expandedQuadrants.has(quadrant.id);
        const previewTasks = quadrant.tasks.slice(0, MAX_PREVIEW_TASKS);
        const hasMore = quadrant.tasks.length > MAX_PREVIEW_TASKS;
        const colors = QUADRANT_COLORS[quadrant.id as keyof typeof QUADRANT_COLORS];

        return (
          <div
            key={quadrant.id}
            className={`rounded-2xl border-2 transition-all ${colors.border}`}
            style={{
              background: 'var(--color-surface-elevated)',
            }}
          >
            {/* Header - Always visible, larger touch target */}
            <button
              onClick={() => toggleQuadrant(quadrant.id)}
              className="w-full p-5 flex items-center justify-between active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-4">
                {/* Emoji Icon */}
                <div
                  className={`w-12 h-12 rounded-xl ${colors.accent} flex items-center justify-center text-2xl shadow-sm`}
                >
                  {quadrant.emoji}
                </div>

                {/* Title & Count */}
                <div className="text-left">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-900)' }}>
                    {quadrant.title}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {quadrant.tasks.length} task{quadrant.tasks.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Expand/Collapse Icon */}
              <svg
                className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                style={{ color: 'var(--color-text-muted)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Task List - Collapsible */}
            {isExpanded && (
              <div className="px-3 pb-3 space-y-3">
                {quadrant.tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'rgba(148,163,184,0.12)' }}>
                      <svg className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No tasks in this quadrant</p>
                  </div>
                ) : (
                  <>
                    {previewTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onDelete={onDeleteTask}
                        onArchive={onArchiveTask}
                        onToggleComplete={onToggleComplete}
                        onOpenDetail={onOpenDetail}
                        onUpdate={onUpdateTask}
                        projects={projects}
                        isEditing={editingTaskId === task.id}
                        onEnterEdit={onEnterEdit}
                        onExitEdit={onExitEdit}
                      />
                    ))}

                    {/* View All Button */}
                    {hasMore && (
                      <button
                        onClick={() => onViewQuadrant(quadrant.id)}
                        className="w-full py-4 rounded-xl border-2 border-dashed transition-all active:scale-[0.98]"
                        style={{
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-700)',
                        }}
                      >
                        <div className="flex items-center justify-center gap-2 font-semibold text-sm">
                          <span>View all {quadrant.tasks.length} tasks</span>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
