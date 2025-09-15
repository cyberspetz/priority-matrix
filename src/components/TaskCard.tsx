import { useDraggable } from '@dnd-kit/core';
import { useEffect, useState } from 'react';

interface TaskCardProps {
  id: string;
  title: string;
  isCompleted: boolean;
  onDelete?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
}

export default function TaskCard({ id, title, isCompleted, onDelete, onToggleComplete }: TaskCardProps) {
  const [mounted, setMounted] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
  });

  // Prevent hydration mismatch by only enabling drag functionality after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white rounded-xl border border-gray-200/60 p-4 hover:border-gray-300 hover:shadow-lg transition-all duration-200 select-none ${
        isDragging ? 'opacity-50 shadow-2xl scale-105 rotate-2' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('Toggle clicked for task:', id); // Debug log
            onToggleComplete?.(id);
          }}
          className="mt-0.5 flex-shrink-0 z-10 relative"
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
          <p className={`text-sm leading-relaxed font-medium transition-colors ${
            isCompleted
              ? 'line-through text-gray-500'
              : 'text-gray-900'
          }`}>
            {title}
          </p>
        </div>

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              console.log('Delete clicked for task:', id); // Debug log
              onDelete(id);
            }}
            className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all duration-200 z-10 relative"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Drag handle - this is where drag listeners should be */}
      <div
        {...(mounted ? listeners : {})}
        {...(mounted ? attributes : {})}
        className={`opacity-0 group-hover:opacity-100 flex justify-center mt-2 transition-opacity ${
          mounted ? 'cursor-move' : 'cursor-default'
        }`}
      >
        <div className="flex gap-1 py-1 px-3 hover:bg-gray-100 rounded">
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}