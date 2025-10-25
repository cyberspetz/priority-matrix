"use client";
import React from 'react';
import TaskCard from './TaskCard';
import type { Task, Project, TaskUpdatePayload } from '@/lib/supabaseClient';

interface QuadrantFocusViewProps {
  quadrantId: string;
  title: string;
  description: string;
  emoji: string;
  tasks: Task[];
  onBack: () => void;
  onDeleteTask?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
  onUpdateTask?: (id: string, updates: TaskUpdatePayload) => void;
  onOpenDetail?: (id: string) => void;
  onArchiveTask?: (id: string) => void;
  projects: Project[];
  editingTaskId?: string | null;
  onEnterEdit?: (id: string) => void;
  onExitEdit?: () => void;
}

const QUADRANT_COLORS = {
  'urgent-important': {
    bg: 'from-emerald-500/10 to-emerald-500/5',
    accent: 'bg-emerald-500',
    text: 'text-emerald-700',
  },
  'not-urgent-important': {
    bg: 'from-sky-500/10 to-sky-500/5',
    accent: 'bg-sky-500',
    text: 'text-sky-700',
  },
  'urgent-not-important': {
    bg: 'from-amber-500/10 to-amber-500/5',
    accent: 'bg-amber-500',
    text: 'text-amber-700',
  },
  'not-urgent-not-important': {
    bg: 'from-slate-500/10 to-slate-500/5',
    accent: 'bg-slate-500',
    text: 'text-slate-700',
  },
};

export default function QuadrantFocusView({
  quadrantId,
  title,
  description,
  emoji,
  tasks,
  onBack,
  onDeleteTask,
  onToggleComplete,
  onUpdateTask,
  onOpenDetail,
  onArchiveTask,
  projects,
  editingTaskId,
  onEnterEdit,
  onExitEdit,
}: QuadrantFocusViewProps) {
  const colors = QUADRANT_COLORS[quadrantId as keyof typeof QUADRANT_COLORS];

  return (
    <div className="min-h-screen pb-24">
      {/* Header with back button and gradient */}
      <div className={`sticky top-0 z-10 bg-gradient-to-b ${colors.bg} backdrop-blur-lg`}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={onBack}
            className="flex items-center gap-2 mb-4 p-2 -ml-2 rounded-lg active:scale-95 transition-transform"
            style={{ color: 'var(--color-text-700)' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to all quadrants</span>
          </button>

          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${colors.accent} flex items-center justify-center text-3xl shadow-lg`}>
              {emoji}
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-900)' }}>
                {title}
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {description} • {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="p-4 space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(148,163,184,0.12)' }}>
              <svg className="w-10 h-10" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-700)' }}>
              All clear!
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              No tasks in this quadrant
            </p>
          </div>
        ) : (
          tasks.map((task) => (
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
          ))
        )}
      </div>
    </div>
  );
}
