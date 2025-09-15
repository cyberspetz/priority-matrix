'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import TaskCard from '@/components/TaskCard';
import Quadrant from '@/components/Quadrant';
import AddTaskModal from '@/components/AddTaskModal';

interface MockTask {
  id: string;
  title: string;
  quadrant: 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [tasks, setTasks] = useState<MockTask[]>([
    {
      id: '1',
      title: 'Fix critical bug in production',
      quadrant: 'urgent-important',
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Plan next quarter strategy',
      quadrant: 'not-urgent-important',
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Respond to urgent emails',
      quadrant: 'urgent-not-important',
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '4',
      title: 'Watch Netflix',
      quadrant: 'not-urgent-not-important',
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getTasksByQuadrant = (quadrant: string) => {
    return tasks.filter(task => task.quadrant === quadrant);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as string;
    const newQuadrant = over.id as MockTask['quadrant'];

    if (taskId && newQuadrant) {
      setTasks(tasks =>
        tasks.map(task =>
          task.id === taskId
            ? { ...task, quadrant: newQuadrant, updated_at: new Date().toISOString() }
            : task
        )
      );
    }
  };

  const addTask = (title: string) => {
    const newTask: MockTask = {
      id: Date.now().toString(),
      title,
      quadrant: 'urgent-important',
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  const deleteTask = (id: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
  };

  const toggleTaskComplete = (id: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id
          ? { ...task, is_completed: !task.is_completed, updated_at: new Date().toISOString() }
          : task
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Priority Matrix
            </h1>
            <p className="text-gray-600">
              Organize your tasks using the Eisenhower Decision Matrix
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Task
          </button>
        </div>

        {/* Matrix */}
        <DndContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-2 gap-6 h-[calc(100vh-220px)]">
            <Quadrant
              id="urgent-important"
              title="Do First"
              description="Urgent & Important"
              tasks={getTasksByQuadrant('urgent-important')}
              accentColor="bg-red-500"
              onDeleteTask={deleteTask}
              onToggleComplete={toggleTaskComplete}
            />
            <Quadrant
              id="not-urgent-important"
              title="Schedule"
              description="Not Urgent & Important"
              tasks={getTasksByQuadrant('not-urgent-important')}
              accentColor="bg-blue-500"
              onDeleteTask={deleteTask}
              onToggleComplete={toggleTaskComplete}
            />
            <Quadrant
              id="urgent-not-important"
              title="Delegate"
              description="Urgent & Not Important"
              tasks={getTasksByQuadrant('urgent-not-important')}
              accentColor="bg-yellow-500"
              onDeleteTask={deleteTask}
              onToggleComplete={toggleTaskComplete}
            />
            <Quadrant
              id="not-urgent-not-important"
              title="Eliminate"
              description="Not Urgent & Not Important"
              tasks={getTasksByQuadrant('not-urgent-not-important')}
              accentColor="bg-gray-500"
              onDeleteTask={deleteTask}
              onToggleComplete={toggleTaskComplete}
            />
          </div>
        </DndContext>

        <AddTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddTask={addTask}
        />
      </div>
    </div>
  );
}