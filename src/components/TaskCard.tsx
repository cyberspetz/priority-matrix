import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import QuickScheduleMenu from './QuickScheduleMenu';
import TaskActionMenu from './TaskActionMenu';
import { useEffect, useState, type CSSProperties, type MouseEvent } from 'react';
import type { TaskPriority, TaskUpdatePayload } from '@/lib/supabaseClient';
import { getPriorityMeta } from '@/lib/priority';

interface TaskCardProps {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
  deadlineAt?: string;
  priority: TaskPriority;
  onDelete?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onOpenDetail?: (id: string) => void;
  onUpdate?: (id: string, updates: TaskUpdatePayload) => void;
}

export default function TaskCard({ id, title, isCompleted, dueDate, deadlineAt, priority, onDelete, onToggleComplete, onArchive, onOpenDetail, onUpdate }: TaskCardProps) {
  const [mounted, setMounted] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  useEffect(() => {
    setMounted(true);
  }, []);

  const getDueDateInfo = () => {
    if (!dueDate) return null;

    const due = (() => {
      const [datePart] = dueDate.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      return new Date(year, (month || 1) - 1, day || 1);
    })();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-rose-700', bgColor: 'bg-rose-50' };
    }
    if (diffDays === 0) {
      return { text: 'Today', color: 'text-emerald-700', bgColor: 'bg-emerald-50' };
    }
    if (diffDays === 1) {
      return { text: 'Tomorrow', color: 'text-amber-700', bgColor: 'bg-amber-50' };
    }
    if (diffDays <= 7) {
      const dayName = due.toLocaleDateString('en-US', { weekday: 'short' });
      return { text: dayName, color: 'text-violet-700', bgColor: 'bg-violet-50' };
    }
    return { text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: 'text-violet-700', bgColor: 'bg-violet-50' };
  };

  const dueDateInfo = !isCompleted ? getDueDateInfo() : null;
  const isDeadlineOver = deadlineAt ? new Date(deadlineAt) < new Date() : false;
  const priorityMeta = getPriorityMeta(priority);

  const style: CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition: transition ?? 'transform 180ms cubic-bezier(0.2, 0, 0.2, 1)',
    willChange: transform ? 'transform' : undefined,
  };

  const handleCardClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!onOpenDetail || isDragging) return;
    const target = event.target as HTMLElement;
    if (target?.closest('[data-skip-task-detail="true"]')) return;
    if (event.detail === 0 || event.detail >= 2) {
      event.preventDefault();
      onOpenDetail(id);
    }
  };

  return (
    <div
      id={`task-${id}`}
      ref={setNodeRef}
      style={style}
      {...(mounted ? listeners : {})}
      {...(mounted ? attributes : {})}
      onClick={handleCardClick}
      onDoubleClick={handleCardClick}
      className={`relative z-30 group select-none rounded-xl border border-gray-200/60 bg-white px-4 py-3 transition-all duration-200 hover:border-gray-300 hover:shadow-lg ${
        isDragging ? 'pointer-events-none scale-105 rotate-1 shadow-2xl' : 'cursor-pointer'
      }`}
    >
      <div className="flex flex-wrap items-start gap-3">
        <button
          type="button"
          data-skip-task-detail="true"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleComplete?.(id);
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          className="relative z-50 flex-shrink-0"
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          <div
            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
              isCompleted
                ? `${priorityMeta.circleBorder} ${priorityMeta.completedFill}`
                : `${priorityMeta.circleBorder} ${priorityMeta.circleFill}`
            }`}
          >
            {isCompleted && (
              <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          <p
            className={`truncate text-sm font-medium transition-colors ${
              isCompleted ? 'line-through text-gray-500' : 'text-gray-900 group-hover:text-blue-600'
            }`}
          >
            {title}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              data-priority-pill
              data-priority-level={priority}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${priorityMeta.badgeTone} ${priorityMeta.badgeText}`}
            >
              <svg className={`h-3 w-3 ${priorityMeta.iconFill}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M5 3a1 1 0 011-1h8a1 1 0 01.8 1.6L13.25 7l1.55 2.4A1 1 0 0114 11H6v6a1 1 0 11-2 0V3z" />
              </svg>
              {priorityMeta.flagLabel}
            </span>
            {dueDateInfo && (
              <div
                title="Scheduled start"
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${dueDateInfo.bgColor} ${dueDateInfo.color}`}
              >
                <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {dueDateInfo.text}
              </div>
            )}
            {deadlineAt && !isCompleted && (
              <div title="Deadline" className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                isDeadlineOver ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
              }`}>
                <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                </svg>
                Deadline
              </div>
            )}
          </div>
        </div>

        <div
          className="order-3 flex w-full items-center justify-end gap-1 pt-2 transition-opacity sm:order-none sm:w-auto sm:justify-normal sm:pt-0 sm:ml-auto md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
          data-skip-task-detail="true"
        >
          {onUpdate && <QuickScheduleMenu id={id} dueDate={dueDate} deadlineAt={deadlineAt} priority={priority} onUpdate={onUpdate} />}
          {(onArchive || onDelete || onOpenDetail) && (
            <TaskActionMenu id={id} title={title} onArchive={onArchive} onDelete={onDelete} onOpenDetail={onOpenDetail} />
          )}
        </div>
      </div>
    </div>
  );
}
