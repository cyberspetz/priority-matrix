import { useDroppable } from '@dnd-kit/core';
import { useEffect, useState } from 'react';
import TaskCard from './TaskCard';
import QuadrantInfoDialog from './QuadrantInfoDialog';
import { Task } from '@/lib/supabaseClient';

interface QuadrantProps {
  id: string;
  title: string;
  description: string;
  tasks: Task[];
  accentColor: string;
  onDeleteTask?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
  onEditTask?: (id: string, newTitle: string) => void;
}

export default function Quadrant({ id, title, description, tasks, accentColor, onDeleteTask, onToggleComplete, onEditTask }: QuadrantProps) {
  const [mounted, setMounted] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const getQuadrantStyles = () => {
    const baseStyles = "bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 flex flex-col transition-all duration-300";

    if (mounted && isOver) {
      return `${baseStyles} ring-2 ring-blue-400/50 shadow-xl scale-[1.02] bg-blue-50/30`;
    }

    return `${baseStyles} hover:shadow-lg hover:border-gray-300/50`;
  };

  return (
    <div
      ref={setNodeRef}
      className={getQuadrantStyles()}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-3 h-3 rounded-full ${accentColor}`}></div>
          <h2 className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <div className="flex-1"></div>
          <button
            onClick={() => setIsInfoDialogOpen(true)}
            className="w-5 h-5 rounded-full bg-gray-200/80 hover:bg-gray-300/80 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200 text-xs font-medium"
            title="Learn more about this quadrant"
          >
            ?
          </button>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
        <p className="text-sm text-gray-600 ml-6">
          {description}
        </p>
      </div>

      {/* Tasks */}
      <div className="flex-1 space-y-3 min-h-[200px]">
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
              onDelete={onDeleteTask}
              onToggleComplete={onToggleComplete}
              onEdit={onEditTask}
            />
          ))
        )}
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