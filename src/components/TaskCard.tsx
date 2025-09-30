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
      <div ref={setNodeRef} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
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
      style={style}
      {...(!isEditing ? listeners : {})}
      {...(!isEditing ? attributes : {})}
      onClick={(event) => {
        if (!onOpenDetail || isDragging) return;
        const target = event.target as HTMLElement;
        if (target?.closest('[data-skip-task-detail="true"]')) return;
        onOpenDetail(task.id);
      }}
      className={`relative z-30 group select-none rounded-2xl border border-gray-200 bg-white px-3 py-3 shadow-sm transition ${
        isDragging ? 'pointer-events-none scale-[1.01] opacity-0' : 'cursor-pointer'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            data-skip-task-detail="true"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleComplete?.(task.id);
            }}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
              task.is_completed ? `${priorityMeta.circleBorder} ${priorityMeta.completedFill}` : `${priorityMeta.circleBorder} ${priorityMeta.circleFill}`
            }`}
            aria-label={task.is_completed ? 'Mark incomplete' : 'Mark complete'}
          >
            {task.is_completed && (
              <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="min-w-0 flex-1 space-y-1">
            <p className={`truncate text-sm font-semibold ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</p>
            {task.notes && (
              <p className="text-xs text-gray-500 line-clamp-2">{task.notes}</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 text-[0.65rem] text-gray-500" data-skip-task-detail="true">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onEnterEdit?.(task.id);
                }}
                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium ${priorityMeta.badgeTone} ${priorityMeta.badgeText}`}
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
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-1.5 py-0.5 font-medium text-blue-700"
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
                  className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium ${
                    isDeadlineOver ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                  }`}
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

        <div className="flex items-start gap-1" data-skip-task-detail="true">
          {onEnterEdit && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onEnterEdit(task.id);
              }}
              className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
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
