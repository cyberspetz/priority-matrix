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
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            My Priority Matrix
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Add New Task
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-[calc(100vh-200px)]">
            <div className="text-xl text-gray-600">Loading tasks...</div>
          </div>
        ) : (
          <DndContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-2 gap-6 h-[calc(100vh-200px)]">
            <Quadrant
              id="urgent-important"
              title="Urgent & Important"
              tasks={getTasksByQuadrant('urgent-important')}
              bgColor="bg-red-50"
              borderColor="border-red-200"
              textColor="text-red-800"
              onDeleteTask={deleteTask}
            />
            <Quadrant
              id="not-urgent-important"
              title="Not Urgent & Important"
              tasks={getTasksByQuadrant('not-urgent-important')}
              bgColor="bg-blue-50"
              borderColor="border-blue-200"
              textColor="text-blue-800"
              onDeleteTask={deleteTask}
            />
            <Quadrant
              id="urgent-not-important"
              title="Urgent & Not Important"
              tasks={getTasksByQuadrant('urgent-not-important')}
              bgColor="bg-yellow-50"
              borderColor="border-yellow-200"
              textColor="text-yellow-800"
              onDeleteTask={deleteTask}
            />
            <Quadrant
              id="not-urgent-not-important"
              title="Not Urgent & Not Important"
              tasks={getTasksByQuadrant('not-urgent-not-important')}
              bgColor="bg-gray-100"
              borderColor="border-gray-300"
              textColor="text-gray-700"
              onDeleteTask={deleteTask}
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
