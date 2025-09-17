import { useDraggable } from '@dnd-kit/core';
import { useEffect, useState } from 'react';

interface TaskCardProps {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
  onDelete?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
  onEdit?: (id: string, newTitle: string) => void;
}

export default function TaskCard({ id, title, isCompleted, dueDate, onDelete, onToggleComplete, onEdit }: TaskCardProps) {
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
  });

  // Prevent hydration mismatch by only enabling drag functionality after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update editTitle when title prop changes
  useEffect(() => {
    setEditTitle(title);
  }, [title]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit && !isCompleted) {
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (onEdit && editTitle.trim() && editTitle.trim() !== title) {
      onEdit(id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Due date utilities inspired by Todoist
  const getDueDateInfo = () => {
    if (!dueDate) return null;

    const due = new Date(dueDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Reset time to compare dates only
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-red-600', bgColor: 'bg-red-50', urgent: true };
    } else if (diffDays === 0) {
      return { text: 'Today', color: 'text-orange-600', bgColor: 'bg-orange-50', urgent: true };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', color: 'text-blue-600', bgColor: 'bg-blue-50', urgent: false };
    } else if (diffDays <= 7) {
      const dayName = due.toLocaleDateString('en-US', { weekday: 'short' });
      return { text: dayName, color: 'text-gray-600', bgColor: 'bg-gray-50', urgent: false };
    } else {
      return { text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: 'text-gray-500', bgColor: 'bg-gray-50', urgent: false };
    }
  };

  const dueDateInfo = getDueDateInfo();

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(mounted ? listeners : {})}
      {...(mounted ? attributes : {})}
      className={`group bg-white rounded-xl border border-gray-200/60 p-3 hover:border-gray-300 hover:shadow-lg transition-all duration-200 select-none ${
        isDragging ? 'opacity-50 shadow-2xl scale-105 rotate-2' : ''
      } ${
        mounted ? 'cursor-move' : 'cursor-default'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('Toggle clicked for task:', id); // Debug log
            onToggleComplete?.(id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{ pointerEvents: 'auto' }}
          className="flex-shrink-0 z-50 relative"
        >
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            isCompleted
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-green-400'
          }`}>
            {isCompleted && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </button>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveEdit}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="w-full text-sm font-medium text-gray-900 bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          ) : (
            <div className="space-y-1">
              <p
                className={`text-sm font-medium transition-colors cursor-pointer truncate ${
                  isCompleted
                    ? 'line-through text-gray-500'
                    : 'text-gray-900 hover:text-blue-600'
                }`}
                onDoubleClick={handleDoubleClick}
                onMouseDown={(e) => {
                  // Allow dragging unless double-clicking to edit
                  if (e.detail === 2) {
                    e.stopPropagation();
                  }
                }}
                title={onEdit && !isCompleted ? "Double-click to edit" : title}
              >
                {title}
              </p>
              {dueDateInfo && (
                <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${dueDateInfo.bgColor} ${dueDateInfo.color}`}>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {dueDateInfo.text}
                </div>
              )}
            </div>
          )}
        </div>

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              console.log('Delete clicked for task:', id); // Debug log
              onDelete(id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
            className={`opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded-md transition-all duration-200 z-50 relative ${
              isCompleted
                ? 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
            title={isCompleted ? "Archive task" : "Delete task"}
          >
            {isCompleted ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 6-6" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        )}
      </div>

    </div>
  );
}