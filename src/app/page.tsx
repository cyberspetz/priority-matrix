'use client';

import { useState, useEffect, useMemo } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
// import TaskCard from '@/components/TaskCard';
import Quadrant from '@/components/Quadrant';
import AddTaskModal from '@/components/AddTaskModal';
import FluidBackground from '@/components/FluidBackground';
import ReportsSidebar from '@/components/ReportsSidebar';
import SidebarNav from '@/components/SidebarNav';
import TaskListItem from '@/components/TaskListItem';
import TaskDetailSheet from '@/components/TaskDetailSheet';
import PasswordProtection from '@/components/PasswordProtection';
import { getAllTasks, createTask, updateTask, deleteTask as deleteTaskFromDB, completeTask, uncompleteTask, archiveTask, Task, TaskUpdatePayload } from '@/lib/supabaseClient';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'inbox' | 'today' | 'upcoming'>('inbox');
  const [loading, setLoading] = useState(true);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [dragData, setDragData] = useState<{ isDragging: boolean; position?: { x: number; y: number } }>({
    isDragging: false
  });

  // Fluid effect configuration with enhanced default settings
  const [fluidConfig] = useState<FluidConfig>({
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

  useEffect(() => {
    if (detailTaskId && !tasks.some(task => task.id === detailTaskId)) {
      setDetailTaskId(null);
    }
  }, [detailTaskId, tasks]);

  const getTasksByQuadrant = (quadrant: string) => {
    return tasks
      .filter(task => task.quadrant === quadrant)
      .sort((a, b) => (a.sort_index ?? 0) - (b.sort_index ?? 0));
  };

  // Derived views
  const localDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = localDateString(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(new Date().getDate() + 1);
  const tomorrowStr = localDateString(tomorrow);

  const isActive = (t: Task) => t.status !== 'archived';

  const todayTasks = tasks.filter(t => isActive(t) && ((t.due_date && t.due_date.startsWith(todayStr)) || (t.created_at?.startsWith?.(todayStr))));
  const upcomingTasks = tasks.filter(t => isActive(t) && t.due_date && (t.due_date >= todayStr));

  const counts = {
    inbox: tasks.filter(isActive).length,
    today: todayTasks.length,
    upcoming: upcomingTasks.filter(t => t.due_date && t.due_date > todayStr).length,
  };

  const detailTask = useMemo(() => {
    if (!detailTaskId) return null;
    return tasks.find(t => t.id === detailTaskId) ?? null;
  }, [detailTaskId, tasks]);

  const handleDragStart = () => {
    setDragData({ isDragging: true });
  };

  const handleDragMove = () => {
    setDragData({ isDragging: true });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setDragData({ isDragging: false });

    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Determine containers (quadrants)
    type SortableMeta = { sortable?: { containerId?: Task['quadrant'] } } | undefined;
    const activeContainer = (active.data.current as SortableMeta)?.sortable?.containerId;
    const overContainer = (over.data.current as SortableMeta)?.sortable?.containerId || (overId as Task['quadrant']);

    if (!overContainer) return;

    const sourceQuadrant = activeContainer || tasks.find(t => t.id === activeId)?.quadrant;
    const targetQuadrant = overContainer;

    // Compute indices within their respective lists
    const sourceList = getTasksByQuadrant(sourceQuadrant!);
    const targetList = getTasksByQuadrant(targetQuadrant);
    const oldIndex = sourceList.findIndex(t => t.id === activeId);
    const overIndex = targetList.findIndex(t => t.id === overId);
    const newIndex = overIndex >= 0 ? overIndex : targetList.length; // append if dropped on container

    if (oldIndex === -1) return;

    try {
      setTasks(prev => {
        let next = [...prev];

        // Remove from source
        const movingTask = next.find(t => t.id === activeId);
        if (!movingTask) return prev;

        // Build new lists
        const newSourceList = sourceList.filter(t => t.id !== activeId);
        const newTargetList = targetList.slice();

        if (sourceQuadrant === targetQuadrant) {
          // Reorder within the same quadrant
          const currentOrder = sourceList.map(t => t.id);
          const reordered = arrayMove(currentOrder, oldIndex, newIndex);
          // Apply new indices
          next = next.map(t => {
            if (t.quadrant !== sourceQuadrant) return t;
            const idx = reordered.indexOf(t.id);
            return { ...t, sort_index: idx } as Task;
          });
        } else {
          // Move across quadrants
          newTargetList.splice(newIndex, 0, movingTask);
          // Reindex both affected quadrants
          next = next.map(t => {
            if (t.id === movingTask.id) {
              return { ...t, quadrant: targetQuadrant, sort_index: newIndex } as Task;
            }
            if (t.quadrant === sourceQuadrant) {
              const idx = newSourceList.findIndex(x => x.id === t.id);
              return { ...t, sort_index: idx } as Task;
            }
            if (t.quadrant === targetQuadrant) {
              const idx = newTargetList.findIndex(x => x.id === t.id);
              return { ...t, sort_index: idx } as Task;
            }
            return t;
          });
        }

        return next;
      });

      // Persist changes to Supabase: update moved item quadrant and reindex sort_index for affected quadrant(s)
      const after = getTasksByQuadrant(targetQuadrant).map((t, idx) => ({ id: t.id, sort_index: idx }));
      const affected: { id: string; updates: Partial<Task> }[] = [];

      if (sourceQuadrant === targetQuadrant) {
        for (const { id, sort_index } of after) affected.push({ id, updates: { sort_index } });
      } else {
        const afterSource = getTasksByQuadrant(sourceQuadrant!).map((t, idx) => ({ id: t.id, sort_index: idx }));
        for (const { id, sort_index } of after) affected.push({ id, updates: { quadrant: targetQuadrant as Task['quadrant'], sort_index } });
        for (const { id, sort_index } of afterSource) affected.push({ id, updates: { sort_index } });
      }

      await Promise.all(affected.map(a => updateTask(a.id, a.updates)));
    } catch (error) {
      console.error('Failed to apply drag reorder:', error);
      const fetchedTasks = await getAllTasks();
      setTasks(fetchedTasks);
    }
  };

  const openTaskDetail = (id: string) => {
    setDetailTaskId(id);
  };

  const closeTaskDetail = () => {
    setDetailTaskId(null);
  };

  const archiveTaskLocal = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      setTasks(prev => prev.filter(t => t.id !== id));
      setDetailTaskId(current => (current === id ? null : current));

      await archiveTask(id);
    } catch (error) {
      console.error('Failed to archive task:', error);
      const fetched = await getAllTasks();
      setTasks(fetched);
    }
  };

  const addTask = async (title: string, dueDate?: string, deadlineAt?: string) => {
    try {
      const newTask = await createTask(title, 'urgent-important', undefined, dueDate, undefined, undefined, undefined, undefined, undefined, deadlineAt);
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
      setDetailTaskId(current => (current === id ? null : current));

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

  const updateTaskFields = async (id: string, updates: TaskUpdatePayload) => {
    try {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      await updateTask(id, updates);
    } catch (error) {
      console.error('Failed to update task fields:', error);
      const fetched = await getAllTasks();
      setTasks(fetched);
    }
  };

  // const handleArchiveCompleted = async () => {
  //   try {
  //     await archiveCompletedTasks();
  //     // Refresh tasks list
  //     const fetchedTasks = await getAllTasks();
  //     setTasks(fetchedTasks);
  //   } catch (error) {
  //     console.error('Failed to archive completed tasks:', error);
  //   }
  // };
  return (
    <PasswordProtection>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Mouse-Interactive Fluid Background */}
      <FluidBackground dragData={dragData} config={fluidConfig} />
      <div className={`${activeView === 'inbox' ? 'max-w-7xl' : 'max-w-3xl'} mx-auto px-4 sm:px-6 lg:px-8 py-6`}>
        {/* Sidebar toggle */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-4 top-4 z-50 p-2 rounded-lg bg-white/90 border border-gray-200 shadow md:left-6 md:top-6"
          title="Open menu"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        {/* Header (hidden on mobile to maximize space) */}
        <div className="hidden md:flex items-center justify-between mb-8">
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
          activeView === 'inbox' ? (
            <DndContext onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 md:h-[calc(100vh-220px)]">
                <Quadrant
                  id="urgent-important"
                  title="Do First"
                  description="Urgent & Important"
                  tasks={getTasksByQuadrant('urgent-important')}
                  accentColor="bg-emerald-500"
                  onDeleteTask={deleteTask}
                  onToggleComplete={toggleTaskComplete}
                  onUpdateTask={updateTaskFields}
                  onOpenDetail={openTaskDetail}
                  onArchiveTask={archiveTaskLocal}
                />
                <Quadrant
                  id="not-urgent-important"
                  title="Schedule"
                  description="Not Urgent & Important"
                  tasks={getTasksByQuadrant('not-urgent-important')}
                  accentColor="bg-sky-500"
                  onDeleteTask={deleteTask}
                  onToggleComplete={toggleTaskComplete}
                  onUpdateTask={updateTaskFields}
                  onOpenDetail={openTaskDetail}
                  onArchiveTask={archiveTaskLocal}
                />
                <Quadrant
                  id="urgent-not-important"
                  title="Delegate"
                  description="Urgent & Not Important"
                  tasks={getTasksByQuadrant('urgent-not-important')}
                  accentColor="bg-amber-500"
                  onDeleteTask={deleteTask}
                  onToggleComplete={toggleTaskComplete}
                  onUpdateTask={updateTaskFields}
                  onOpenDetail={openTaskDetail}
                  onArchiveTask={archiveTaskLocal}
                />
                <Quadrant
                  id="not-urgent-not-important"
                  title="Eliminate"
                  description="Not Urgent & Not Important"
                  tasks={getTasksByQuadrant('not-urgent-not-important')}
                  accentColor="bg-slate-500"
                  onDeleteTask={deleteTask}
                  onToggleComplete={toggleTaskComplete}
                  onUpdateTask={updateTaskFields}
                  onOpenDetail={openTaskDetail}
                  onArchiveTask={archiveTaskLocal}
                />
              </div>
            </DndContext>
          ) : activeView === 'today' ? (
            <div className="space-y-3 w-full max-w-2xl mx-auto">
              {todayTasks.length === 0 && <div className="text-sm text-gray-500">No tasks for today.</div>}
              {todayTasks.map(t => (
                <TaskListItem
                  key={t.id}
                  id={t.id}
                  title={t.title}
                  quadrant={t.quadrant}
                  dueDate={t.due_date}
                  deadlineAt={t.deadline_at}
                  isCompleted={t.is_completed}
                  onToggleComplete={toggleTaskComplete}
                  onDelete={deleteTask}
                  onUpdate={updateTaskFields}
                  onOpenDetail={openTaskDetail}
                  onArchive={archiveTaskLocal}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-6 w-full max-w-2xl mx-auto">
              {/* Upcoming: groups */}
              <div>
                <div className="text-xs font-semibold text-slate-600 mb-2">Today</div>
                <div className="space-y-3">
                  {tasks.filter(t => isActive(t) && t.due_date?.startsWith(todayStr)).map(t => (
                    <TaskListItem
                      key={t.id}
                      id={t.id}
                      title={t.title}
                      quadrant={t.quadrant}
                      dueDate={t.due_date}
                      deadlineAt={t.deadline_at}
                      isCompleted={t.is_completed}
                      onToggleComplete={toggleTaskComplete}
                      onDelete={deleteTask}
                      onUpdate={updateTaskFields}
                      onOpenDetail={openTaskDetail}
                      onArchive={archiveTaskLocal}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600 mb-2">Tomorrow</div>
                <div className="space-y-3">
                  {tasks.filter(t => isActive(t) && t.due_date === tomorrowStr).map(t => (
                    <TaskListItem
                      key={t.id}
                      id={t.id}
                      title={t.title}
                      quadrant={t.quadrant}
                      dueDate={t.due_date}
                      deadlineAt={t.deadline_at}
                      isCompleted={t.is_completed}
                      onToggleComplete={toggleTaskComplete}
                      onDelete={deleteTask}
                      onUpdate={updateTaskFields}
                      onOpenDetail={openTaskDetail}
                      onArchive={archiveTaskLocal}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600 mb-2">Next 7 days</div>
                <div className="space-y-3">
                  {tasks.filter(t => {
                    if (!isActive(t) || !t.due_date) return false;
                    return t.due_date > tomorrowStr && (new Date(t.due_date) <= new Date(new Date().setDate(new Date().getDate() + 7)));
                  }).map(t => (
                    <TaskListItem
                      key={t.id}
                      id={t.id}
                      title={t.title}
                      quadrant={t.quadrant}
                      dueDate={t.due_date}
                      deadlineAt={t.deadline_at}
                      isCompleted={t.is_completed}
                      onToggleComplete={toggleTaskComplete}
                      onDelete={deleteTask}
                      onUpdate={updateTaskFields}
                      onOpenDetail={openTaskDetail}
                      onArchive={archiveTaskLocal}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600 mb-2">Later</div>
                <div className="space-y-3">
                  {tasks.filter(t => {
                    if (!isActive(t) || !t.due_date) return false;
                    return new Date(t.due_date) > new Date(new Date().setDate(new Date().getDate() + 7));
                  }).map(t => (
                    <TaskListItem
                      key={t.id}
                      id={t.id}
                      title={t.title}
                      quadrant={t.quadrant}
                      dueDate={t.due_date}
                      deadlineAt={t.deadline_at}
                      isCompleted={t.is_completed}
                      onToggleComplete={toggleTaskComplete}
                      onDelete={deleteTask}
                      onUpdate={updateTaskFields}
                      onOpenDetail={openTaskDetail}
                      onArchive={archiveTaskLocal}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        )}

        <AddTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddTask={addTask}
        />

        <TaskDetailSheet
          task={detailTask}
          isOpen={Boolean(detailTask)}
          onClose={closeTaskDetail}
          onUpdate={(taskId, updates) => updateTaskFields(taskId, updates)}
          onToggleComplete={toggleTaskComplete}
          onDelete={async (taskId) => {
            closeTaskDetail();
            await deleteTask(taskId);
          }}
          onArchive={(taskId) => archiveTaskLocal(taskId)}
        />

        <ReportsSidebar
          isOpen={isReportsOpen}
          onClose={() => setIsReportsOpen(false)}
        />

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="md:hidden fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition-all duration-200 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
          aria-label="Add task"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14m7-7H5" />
          </svg>
        </button>

        {/* Premium Floating Toggle Button - hidden on mobile */}
        {!isReportsOpen && (
          <button
            onClick={() => setIsReportsOpen(true)}
            className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 translate-x-3 w-10 h-10 bg-gradient-to-bl from-slate-800/90 via-slate-700/90 to-slate-900/90 backdrop-blur-lg border border-white/10 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 items-center justify-center group hover:from-slate-700/95 hover:via-slate-600/95 hover:to-slate-800/95 z-40"
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
      <SidebarNav
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onAddTask={() => setIsModalOpen(true)}
        onSelect={(view) => setActiveView(view)}
        counts={counts}
      />
    </div>
    </PasswordProtection>
  );
}
