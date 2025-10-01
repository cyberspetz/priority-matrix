import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
const TaskCard = lazy(() => import('./TaskCard'));
import QuadrantInfoDialog from './QuadrantInfoDialog';
import { type Project, type Task, type TaskUpdatePayload } from '@/lib/supabaseClient';

interface QuadrantProps {
  id: string;
  title: string;
  description: string;
  tasks: Task[];
  accentColor: string;
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

export default function Quadrant({ id, title, description, tasks, accentColor, onDeleteTask, onToggleComplete, onUpdateTask, onOpenDetail, onArchiveTask, projects, editingTaskId, onEnterEdit, onExitEdit }: QuadrantProps) {
  const [mounted, setMounted] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const getQuadrantStyles = () => {
    const baseStyles = "rounded-2xl border p-2 transition-all duration-300 flex flex-col overflow-visible";

    if (mounted && isOver) {
      return `${baseStyles} shadow-xl scale-[1.01]`;
    }

    return `${baseStyles}`;
  };

  const renderedTasks = useMemo(() => {
    if (!tasks.length) return null;

    return (
      <Suspense fallback={<div className="h-24 rounded-2xl border border-dashed border-gray-200 bg-white/60" />}>
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={onDeleteTask}
            onArchive={onArchiveTask}
            onToggleComplete={onToggleComplete}
            onOpenDetail={onOpenDetail}
            onUpdate={(taskId, updates) => onUpdateTask?.(taskId, updates)}
            projects={projects}
            isEditing={editingTaskId === task.id}
            onEnterEdit={onEnterEdit}
            onExitEdit={onExitEdit}
          />
        ))}
      </Suspense>
    );
  }, [tasks, onDeleteTask, onArchiveTask, onToggleComplete, onOpenDetail, onUpdateTask, projects, editingTaskId, onEnterEdit, onExitEdit]);

  return (
    <div
      ref={setNodeRef}
      className={`${getQuadrantStyles()} max-w-md mx-auto md:mx-0 md:max-w-none`}
      style={{
        background: 'var(--color-surface-elevated)',
        borderColor: mounted && isOver ? 'var(--color-primary-400)' : 'var(--color-border)',
        boxShadow: mounted && isOver ? '0 20px 40px rgba(255,113,103,0.18)' : 'var(--shadow-soft)'
      }}
    >
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex items-center gap-3 mb-1 md:mb-2">
          <div className="w-3 h-3 rounded-full" style={{ background: accentColor }}></div>
          <h2 className="text-base md:text-lg font-semibold text-[var(--color-text-900)]">
            {title}
          </h2>
          <div className="flex-1"></div>
          <button
            onClick={() => setIsInfoDialogOpen(true)}
            className="hidden md:flex w-5 h-5 rounded-full items-center justify-center transition-all duration-200 text-xs font-medium"
            style={{ background: 'rgba(15,23,42,0.08)', color: 'var(--color-text-700)' }}
            title="Learn more about this quadrant"
          >
            ?
          </button>
          <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: 'rgba(148, 163, 184, 0.2)', color: 'var(--color-text-700)' }}>
            {tasks.length}
          </span>
        </div>
        <p className="hidden md:block text-sm ml-6" style={{ color: 'var(--color-text-muted)' }}>
          {description}
        </p>
      </div>

      {/* Tasks (Sortable) */}
      <div className="flex-1 space-y-2 md:space-y-3 min-h-[120px] md:min-h-[200px]">
        <SortableContext id={id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'rgba(148,163,184,0.16)' }}>
                  <svg className="w-6 h-6" style={{ color: 'var(--color-secondary-500)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Drop tasks here</p>
              </div>
            </div>
          ) : (
            renderedTasks
          )}
        </SortableContext>
      </div>

      {/* Info Dialog */}
      <QuadrantInfoDialog
        isOpen={isInfoDialogOpen}
        onClose={() => setIsInfoDialogOpen(false)}
        quadrantId={id}
        title={title}
        description={description}
      />
    </div>
  );
}
