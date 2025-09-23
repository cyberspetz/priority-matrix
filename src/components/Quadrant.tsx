import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useEffect, useState } from 'react';
import TaskCard from './TaskCard';
import QuadrantInfoDialog from './QuadrantInfoDialog';
import { Task } from '@/lib/supabaseClient';
import type { TaskUpdatePayload } from '@/lib/supabaseClient';

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
}

export default function Quadrant({ id, title, description, tasks, accentColor, onDeleteTask, onToggleComplete, onUpdateTask, onOpenDetail, onArchiveTask }: QuadrantProps) {
  const [mounted, setMounted] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const getQuadrantStyles = () => {
    const baseStyles = "rounded-2xl border border-transparent bg-transparent p-2 transition-all duration-300 md:border-gray-200/50 md:bg-white/70 md:p-6 md:backdrop-blur-sm flex flex-col overflow-visible";

    if (mounted && isOver) {
      return `${baseStyles} ring-2 ring-blue-400/40 shadow-xl scale-[1.01] md:bg-blue-50/30`;
    }

    return `${baseStyles} md:hover:shadow-lg md:hover:border-gray-300/50`;
  };

  return (
    <div
      ref={setNodeRef}
      className={getQuadrantStyles()}
    >
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex items-center gap-3 mb-1 md:mb-2">
          <div className={`w-3 h-3 rounded-full ${accentColor}`}></div>
          <h2 className="text-base md:text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <div className="flex-1"></div>
          <button
            onClick={() => setIsInfoDialogOpen(true)}
            className="hidden md:flex w-5 h-5 rounded-full bg-gray-200/80 hover:bg-gray-300/80 items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200 text-xs font-medium"
            title="Learn more about this quadrant"
          >
            ?
          </button>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
        <p className="hidden md:block text-sm text-gray-600 ml-6">
          {description}
        </p>
      </div>

      {/* Tasks (Sortable) */}
      <div className="flex-1 space-y-2 md:space-y-3 min-h-[120px] md:min-h-[200px]">
        <SortableContext id={id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Drop tasks here</p>
              </div>
            </div>
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task.id}
                id={task.id}
                title={task.title}
                isCompleted={task.is_completed}
                dueDate={task.due_date}
                deadlineAt={task.deadline_at}
                priority={task.priority_level ?? 'p3'}
                onDelete={onDeleteTask}
                onArchive={onArchiveTask}
                onToggleComplete={onToggleComplete}
                onOpenDetail={onOpenDetail}
                onUpdate={(taskId, updates) => onUpdateTask?.(taskId, updates)}
              />
            ))
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
