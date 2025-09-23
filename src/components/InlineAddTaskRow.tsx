"use client";
import { useState, FormEvent } from 'react';

interface InlineAddTaskRowProps {
  onAdd: (title: string) => Promise<void> | void;
  className?: string;
}

export default function InlineAddTaskRow({ onAdd, className }: InlineAddTaskRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [pending, setPending] = useState(false);

  const reset = () => {
    setTitle('');
    setExpanded(false);
    setPending(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setPending(true);
    try {
      await onAdd(title.trim());
      reset();
    } catch (error) {
      console.error('Failed to add task inline', error);
      setPending(false);
    }
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={`flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-left text-sm text-gray-600 transition hover:border-blue-400 hover:text-blue-600 ${className ?? ''}`}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
        </svg>
        Add task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`flex w-full flex-col gap-2 rounded-lg border border-blue-200 bg-blue-50/40 p-3 ${className ?? ''}`}>
      <input
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Start typing to add a task"
        className="w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        autoFocus
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-transparent px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending || !title.trim()}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {pending ? 'Adding...' : 'Add task'}
        </button>
      </div>
    </form>
  );
}
