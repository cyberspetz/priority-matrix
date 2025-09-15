'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import TaskCard from '@/components/TaskCard';
import Quadrant from '@/components/Quadrant';
import AddTaskModal from '@/components/AddTaskModal';
import { getAllTasks, createTask, updateTask, deleteTask as deleteTaskFromDB, Task } from '@/lib/supabaseClient';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const handleDragEnd = async (event: DragEndEvent) => {
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

  const addTask = async (title: string) => {
    try {
      const newTask = await createTask(title, 'urgent-important');
      setTasks(prevTasks => [...prevTasks, newTask]);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      // Optimistically update the UI
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));

      // Delete from Supabase
      await deleteTaskFromDB(id);
    } catch (error) {
      console.error('Failed to delete task:', error);
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
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === id
            ? { ...task, is_completed: !task.is_completed }
            : task
        )
      );

      // Update in Supabase
      await updateTask(id, { is_completed: !task.is_completed });
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      // Revert the optimistic update by refetching
      const fetchedTasks = await getAllTasks();
      setTasks(fetchedTasks);
    }
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

        {loading ? (
          <div className="flex justify-center items-center h-[calc(100vh-200px)]">
            <div className="text-xl text-gray-600">Loading tasks...</div>
          </div>
        ) : (
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
        )}

        <AddTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddTask={addTask}
        />
      </div>
    </div>
  );
}
