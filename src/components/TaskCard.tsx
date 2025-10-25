import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties } from 'react';
import TaskActionMenu from './TaskActionMenu';
import TaskInlineEditor from './TaskInlineEditor';
import type { Project, Task, TaskUpdatePayload } from '@/lib/supabaseClient';
import { getPriorityMeta } from '@/lib/priority';

interface TaskCardProps {
  task: Task;
  onDelete?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onOpenDetail?: (id: string) => void;
  onUpdate?: (id: string, updates: TaskUpdatePayload) => Promise<void> | void;
  projects: Project[];
  isEditing?: boolean;
  onEnterEdit?: (id: string) => void;
  onExitEdit?: () => void;
}

export default function TaskCard({
  task,
  onDelete,
  onToggleComplete,
  onArchive,
  onOpenDetail,
  onUpdate,
  projects,
  isEditing,
  onEnterEdit,
  onExitEdit,
}: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, disabled: Boolean(isEditing) });

  if (isEditing && onUpdate) {
    return (
      <div
        ref={setNodeRef}
        className="rounded-2xl border p-4 shadow-sm"
        style={{
          background: 'var(--color-surface-elevated)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-soft)'
        }}
      >
        <TaskInlineEditor
          task={task}
          projects={projects}
          onCancel={onExitEdit ?? (() => {})}
          onSave={async (updates) => {
            await onUpdate(task.id, updates);
            onExitEdit?.();
          }}
        />
      </div>
    );
  }

  const style: CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition: transition ?? 'transform 180ms cubic-bezier(0.2, 0, 0.2, 1)',
    willChange: transform ? 'transform' : undefined,
  };

  const priorityMeta = getPriorityMeta(task.priority_level ?? 'p3');
  const dueLabel = task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;
  const isDeadlineOver = task.deadline_at ? new Date(task.deadline_at) < new Date() : false;

  return (
    <div
      id={`task-${task.id}`}
      ref={setNodeRef}
      style={{
        ...style,
        background: 'var(--color-surface-elevated)',
        borderColor: 'var(--color-border)',
        boxShadow: isDragging ? 'none' : 'var(--shadow-soft)',
      }}
      {...(!isEditing ? listeners : {})}
      {...(!isEditing ? attributes : {})}
      onClick={(event) => {
        if (!onOpenDetail || isDragging) return;
        const target = event.target as HTMLElement;
        if (target?.closest('[data-skip-task-detail="true"], [data-card-text]')) return;
        onOpenDetail(task.id);
      }}
      className={`relative z-30 group select-none rounded-2xl border px-3 py-3 transition ${
        isDragging ? 'pointer-events-none scale-[1.01] opacity-0' : 'cursor-pointer'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            type="button"
            data-skip-task-detail="true"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleComplete?.(task.id);
            }}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition"
            style={{
              borderColor: priorityMeta.circleBorderColor ?? '#e2e8f0',
              background: task.is_completed ? priorityMeta.completedFillColor ?? 'var(--color-primary-500)' : priorityMeta.circleFillColor ?? 'transparent',
              color: task.is_completed ? '#ffffff' : priorityMeta.circleBorderColor ?? 'var(--color-primary-500)'
            }}
            aria-label={task.is_completed ? 'Mark incomplete' : 'Mark complete'}
          >
            {task.is_completed && (
              <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="min-w-0 flex-1 space-y-1" data-card-text>
            <p className={`truncate text-sm font-semibold ${task.is_completed ? 'line-through' : ''}`} style={{ color: task.is_completed ? 'var(--color-text-muted)' : 'var(--color-text-900)' }}>{task.title}</p>
            {task.notes && (
              <p className="text-xs line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{task.notes}</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 text-[0.65rem]" style={{ color: 'var(--color-text-muted)' }} data-skip-task-detail="true">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onEnterEdit?.(task.id);
                }}
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium"
                style={{
                  background: priorityMeta.badgeFillColor ?? 'rgba(255,113,103,0.15)',
                  color: priorityMeta.badgeTextColor ?? 'var(--color-primary-600)'
                }}
              >
                <svg className={`h-[0.65rem] w-[0.65rem] ${priorityMeta.iconFill}`} viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a1 1 0 011-1h8a1 1 0 01.8 1.6L13.25 7l1.55 2.4A1 1 0 0114 11H6v6a1 1 0 11-2 0V3z" />
                </svg>
                {priorityMeta.flagLabel}
              </button>
              {dueLabel && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onEnterEdit?.(task.id);
                  }}
                  className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium"
                  style={{ background: 'rgba(54,183,180,0.16)', color: 'var(--color-secondary-500)' }}
                >
                  <svg className="h-[0.65rem] w-[0.65rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {dueLabel}
                </button>
              )}
              {task.deadline_at && !task.is_completed && (
                <button
              type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onEnterEdit?.(task.id);
                  }}
                  className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium"
                  style={{
                    background: isDeadlineOver ? 'rgba(244,63,94,0.12)' : 'rgba(148,163,184,0.2)',
                    color: isDeadlineOver ? '#e11d48' : 'var(--color-text-500)'
                  }}
                >
                  <svg className="h-[0.65rem] w-[0.65rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                  </svg>
                  Deadline
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-1 shrink-0" data-skip-task-detail="true">
          {onEnterEdit && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onEnterEdit(task.id);
              }}
              className="rounded-full p-1.5 transition"
              style={{ color: 'var(--color-text-muted)' , background: 'rgba(148, 163, 184, 0.12)'}}
              aria-label="Edit task"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 13.5V16h2.5L15 7.5l-2.5-2.5L4 13.5z" />
              </svg>
            </button>
          )}
          <TaskActionMenu id={task.id} title={task.title} onArchive={onArchive} onDelete={onDelete} onOpenDetail={onOpenDetail} />
        </div>
      </div>

    <div className="mt-3" />
    </div>
  );
}
