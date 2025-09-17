'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragMoveEvent } from '@dnd-kit/core';
import TaskCard from '@/components/TaskCard';
import Quadrant from '@/components/Quadrant';
import AddTaskModal from '@/components/AddTaskModal';
import FluidBackground from '@/components/FluidBackground';
import ReportsSidebar from '@/components/ReportsSidebar';
import PasswordProtection from '@/components/PasswordProtection';
import { getAllTasks, createTask, updateTask, deleteTask as deleteTaskFromDB, completeTask, uncompleteTask, archiveCompletedTasks, archiveTask, Task } from '@/lib/supabaseClient';

interface FluidConfig {
  intensity: number;
  colorIntensity: number;
  splatRadius: number;
  forceMultiplier: number;
  velocityDissipation: number;
  densityDissipation: number;
  curl: number;
  colorful: boolean;
  baseColorR: number;
  baseColorG: number;
  baseColorB: number;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragData, setDragData] = useState<{ isDragging: boolean; position?: { x: number; y: number } }>({
    isDragging: false
  });

  // Fluid effect configuration with enhanced default settings
  const [fluidConfig, setFluidConfig] = useState<FluidConfig>({
    intensity: 1.5,
    colorIntensity: 2.0,
    splatRadius: 0.3,
    forceMultiplier: 18000,
    velocityDissipation: 0.08,
    densityDissipation: 0.6,
    curl: 60,
    colorful: true,
    baseColorR: 0.5,
    baseColorG: 0.3,
    baseColorB: 0.8
  });

  // Load tasks from Supabase on component mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const fetchedTasks = await getAllTasks();
        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Failed to load tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  const getTasksByQuadrant = (quadrant: string) => {
    return tasks.filter(task => task.quadrant === quadrant);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setDragData({ isDragging: true });
  };

  const handleDragMove = (event: DragMoveEvent) => {
    setDragData({ isDragging: true });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setDragData({ isDragging: false });

    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as string;
    const newQuadrant = over.id as Task['quadrant'];

    if (taskId && newQuadrant) {
      try {
        // Optimistically update the UI
        setTasks(tasks =>
          tasks.map(task =>
            task.id === taskId
              ? { ...task, quadrant: newQuadrant }
              : task
          )
        );

        // Update in Supabase
        await updateTask(taskId, { quadrant: newQuadrant });
      } catch (error) {
        console.error('Failed to update task:', error);
        // Revert the optimistic update by refetching
        const fetchedTasks = await getAllTasks();
        setTasks(fetchedTasks);
      }
    }
  };

  const addTask = async (title: string, dueDate?: string) => {
    try {
      const newTask = await createTask(title, 'urgent-important', undefined, dueDate);
      setTasks(prevTasks => [...prevTasks, newTask]);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) {
        console.log('Task not found:', id);
        return;
      }

      console.log('Delete task clicked:', {
        id,
        title: task.title,
        is_completed: task.is_completed,
        status: task.status
      });

      // Optimistically update the UI
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));

      // Archive completed tasks, delete active tasks
      if (task.is_completed) {
        console.log('Archiving completed task:', id);
        await archiveTask(id);
        console.log('Task archived successfully:', id);
      } else {
        console.log('Deleting active task:', id);
        await deleteTaskFromDB(id);
        console.log('Task deleted successfully:', id);
      }
    } catch (error) {
      console.error('Failed to delete/archive task:', error);
      // Revert the optimistic update by refetching
      const fetchedTasks = await getAllTasks();
      setTasks(fetchedTasks);
    }
  };

  const toggleTaskComplete = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      // Optimistically update the UI
      const isCompleting = !task.is_completed;
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === id
            ? {
                ...task,
                is_completed: isCompleting,
                status: isCompleting ? 'completed' : 'active',
                completed_at: isCompleting ? new Date().toISOString() : undefined
              }
            : task
        )
      );

      // Update in Supabase using the new functions
      if (isCompleting) {
        await completeTask(id);
      } else {
        await uncompleteTask(id);
      }
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      // Revert the optimistic update by refetching
      const fetchedTasks = await getAllTasks();
      setTasks(fetchedTasks);
    }
  };

  const editTask = async (id: string, newTitle: string) => {
    try {
      if (!newTitle.trim()) return;

      // Optimistically update the UI
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === id
            ? { ...task, title: newTitle.trim() }
            : task
        )
      );

      // Update in Supabase
      await updateTask(id, { title: newTitle.trim() });
    } catch (error) {
      console.error('Failed to edit task:', error);
      // Revert the optimistic update by refetching
      const fetchedTasks = await getAllTasks();
      setTasks(fetchedTasks);
    }
  };

  const handleArchiveCompleted = async () => {
    try {
      await archiveCompletedTasks();
      // Refresh tasks list
      const fetchedTasks = await getAllTasks();
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Failed to archive completed tasks:', error);
    }
  };
  return (
    <PasswordProtection>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Mouse-Interactive Fluid Background */}
      <FluidBackground dragData={dragData} config={fluidConfig} />
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsReportsOpen(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Reports
            </button>

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
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-[calc(100vh-200px)]">
            <div className="text-xl text-gray-600">Loading tasks...</div>
          </div>
        ) : (
          <DndContext onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-2 gap-6 h-[calc(100vh-220px)]">
              <Quadrant
                id="urgent-important"
                title="Do First"
                description="Urgent & Important"
                tasks={getTasksByQuadrant('urgent-important')}
                accentColor="bg-red-500"
                onDeleteTask={deleteTask}
                onToggleComplete={toggleTaskComplete}
                onEditTask={editTask}
              />
              <Quadrant
                id="not-urgent-important"
                title="Schedule"
                description="Not Urgent & Important"
                tasks={getTasksByQuadrant('not-urgent-important')}
                accentColor="bg-blue-500"
                onDeleteTask={deleteTask}
                onToggleComplete={toggleTaskComplete}
                onEditTask={editTask}
              />
              <Quadrant
                id="urgent-not-important"
                title="Delegate"
                description="Urgent & Not Important"
                tasks={getTasksByQuadrant('urgent-not-important')}
                accentColor="bg-yellow-500"
                onDeleteTask={deleteTask}
                onToggleComplete={toggleTaskComplete}
                onEditTask={editTask}
              />
              <Quadrant
                id="not-urgent-not-important"
                title="Eliminate"
                description="Not Urgent & Not Important"
                tasks={getTasksByQuadrant('not-urgent-not-important')}
                accentColor="bg-gray-500"
                onDeleteTask={deleteTask}
                onToggleComplete={toggleTaskComplete}
                onEditTask={editTask}
              />
            </div>
          </DndContext>
        )}

        <AddTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddTask={addTask}
        />

        <ReportsSidebar
          isOpen={isReportsOpen}
          onClose={() => setIsReportsOpen(false)}
        />

        {/* Premium Floating Toggle Button - Shows when sidebar is closed */}
        {!isReportsOpen && (
          <button
            onClick={() => setIsReportsOpen(true)}
            className="fixed right-0 top-1/2 -translate-y-1/2 translate-x-3 w-10 h-10 bg-gradient-to-bl from-slate-800/90 via-slate-700/90 to-slate-900/90 backdrop-blur-lg border border-white/10 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:from-slate-700/95 hover:via-slate-600/95 hover:to-slate-800/95 z-40"
            title="Show Reports"
          >
            <div className="relative">
              <svg
                className="w-3 h-3 text-white/70 group-hover:text-white transition-colors duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              <div className="absolute inset-0 bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </button>
        )}
      </div>
    </div>
    </PasswordProtection>
  );
}
