'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getCompletedTasks,
  getOverdueTasks,
  getTasksByStatus,
  supabase,
  Task
} from '@/lib/supabaseClient';

interface ReportsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DailyStats {
  date: string;
  completed: number;
  created: number;
  avgTime?: number;
}

interface WeeklyReport {
  weekStart: string;
  days: DailyStats[];
  totalCompleted: number;
  totalCreated: number;
  productivityScore: number;
}

export default function ReportsSidebar({ isOpen, onClose }: ReportsSidebarProps) {
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [activeView, setActiveView] = useState<'today' | 'week' | 'overdue'>('today');
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const loadTodayStats = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [completedToday, activeTasks] = await Promise.all([
      getCompletedTasks(today, tomorrow),
      getTasksByStatus('active')
    ]);

    const avgTime = completedToday.length > 0
      ? completedToday.reduce((sum, task) => sum + (task.actual_time || 0), 0) / completedToday.length
      : 0;

    setTodayStats({
      date: today,
      completed: completedToday.length,
      created: activeTasks.filter(task =>
        task.created_at.startsWith(today)
      ).length,
      avgTime
    });
  }, []);

  const loadOverdueTasksCallback = useCallback(async () => {
    const overdue = await getOverdueTasks();
    setOverdueTasks(overdue);
  }, []);

  const loadWeeklyReport = useCallback(async () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const days: DailyStats[] = [];
    let totalCompleted = 0;
    let totalCreated = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];

      const [completed, active] = await Promise.all([
        getCompletedTasks(dateStr, nextDayStr),
        getTasksByStatus('active')
      ]);

      const created = active.filter(task =>
        task.created_at.startsWith(dateStr)
      ).length;

      const avgTime = completed.length > 0
        ? completed.reduce((sum, task) => sum + (task.actual_time || 0), 0) / completed.length
        : 0;

      const dayStats: DailyStats = {
        date: dateStr,
        completed: completed.length,
        created,
        avgTime
      };

      days.push(dayStats);
      totalCompleted += completed.length;
      totalCreated += created;
    }

    const productivityScore = totalCreated > 0 ? (totalCompleted / totalCreated) * 100 : 0;

    setWeeklyReport({
      weekStart: weekStart.toISOString().split('T')[0],
      days,
      totalCompleted,
      totalCreated,
      productivityScore
    });
  }, []);

  const loadReportData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTodayStats(),
        loadWeeklyReport(),
        loadOverdueTasksCallback()
      ]);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadOverdueTasksCallback, loadTodayStats, loadWeeklyReport]);

  useEffect(() => {
    if (isOpen) {
      loadReportData();
    }
  }, [isOpen, loadReportData]);

  const generateWeeklySummary = async () => {
    if (!weeklyReport) return;

    try {
      // Get all tasks completed during the week (including archived ones)
      const weekStartDate = new Date(weeklyReport.weekStart);
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekStartDate.getDate() + 7);

      // Query for tasks that were completed during this week (both completed and archived status)
      const { data: completedTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .in('status', ['completed', 'archived'])
        .gte('completed_at', weekStartDate.toISOString().split('T')[0])
        .lte('completed_at', weekEndDate.toISOString().split('T')[0])
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching completed tasks:', error);
        throw error;
      }

      // Group tasks by quadrant
      const tasks = completedTasks || [];
      const tasksByQuadrant = {
        'urgent-important': tasks.filter(t => t.quadrant === 'urgent-important'),
        'not-urgent-important': tasks.filter(t => t.quadrant === 'not-urgent-important'),
        'urgent-not-important': tasks.filter(t => t.quadrant === 'urgent-not-important'),
        'not-urgent-not-important': tasks.filter(t => t.quadrant === 'not-urgent-not-important')
      };

      const quadrantLabels = {
        'urgent-important': '🔥 DO FIRST (Urgent & Important)',
        'not-urgent-important': '📅 SCHEDULE (Not Urgent & Important)',
        'urgent-not-important': '🤝 DELEGATE (Urgent & Not Important)',
        'not-urgent-not-important': '🗑️ ELIMINATE (Not Urgent & Not Important)'
      };

      const currentDate = new Date();
      const formatDate = (date: Date) => date.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      const summary = `
🗓️ WEEKLY PRODUCTIVITY REPORT
${formatDate(weekStartDate)} - ${formatDate(weekEndDate)}

📊 KEY METRICS
• Tasks Completed: ${weeklyReport.totalCompleted}
• Tasks Created: ${weeklyReport.totalCreated}
• Productivity Score: ${Math.round(weeklyReport.productivityScore)}%
• Completion Rate: ${weeklyReport.totalCreated > 0 ? Math.round((weeklyReport.totalCompleted / weeklyReport.totalCreated) * 100) : 0}%

📈 DAILY BREAKDOWN
${weeklyReport.days.map(day => {
  const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' });
  return `${dayName}: ✅ ${day.completed} completed, ➕ ${day.created} created`;
}).join('\n')}

📋 COMPLETED TASKS BY PRIORITY
${Object.entries(tasksByQuadrant).map(([quadrant, tasks]) => {
  if (tasks.length === 0) return '';
  return `\n${quadrantLabels[quadrant as keyof typeof quadrantLabels]} (${tasks.length})\n${tasks.map(task => `• ${task.title}`).join('\n')}`;
}).filter(section => section).join('\n')}

🎯 PERFORMANCE INSIGHTS
${weeklyReport.productivityScore >= 80 ? '🌟 Excellent productivity week!' :
  weeklyReport.productivityScore >= 60 ? '✅ Good productivity week!' :
  weeklyReport.productivityScore >= 40 ? '📈 Room for improvement' :
  '🔄 Focus needed for next week'}

${overdueTasks.length > 0 ? `⚠️ OVERDUE ITEMS: ${overdueTasks.length} tasks need attention\n${overdueTasks.slice(0, 5).map(task => `• ${task.title}`).join('\n')}${overdueTasks.length > 5 ? `\n...and ${overdueTasks.length - 5} more` : ''}` : '✨ No overdue tasks - great job!'}

Generated on ${formatDate(currentDate)}
      `.trim();

      // Copy to clipboard
      navigator.clipboard.writeText(summary).then(() => {
        alert('Weekly summary with completed tasks copied to clipboard! Ready to share with your manager.');
      }).catch(() => {
        // Fallback: Download as text file
        const blob = new Blob([summary], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `weekly-summary-${weeklyReport.weekStart}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Error generating weekly summary:', error);
      alert('Error generating summary. Please try again.');
    }
  };

  const exportData = () => {
    const data = {
      todayStats,
      weeklyReport,
      overdueTasks: overdueTasks.length,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `priority-matrix-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/20"
        onClick={onClose}
        onPointerDown={onClose}
      />
      <div
        className="fixed right-0 top-0 z-40 h-full w-full max-w-xl backdrop-blur-sm overflow-hidden"
        style={{
          background: 'rgba(245, 247, 251, 0.9)',
          borderLeft: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-soft)'
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
      {/* Premium Toggle Button - Inspired by high-end design */}
      <button
         onClick={onClose}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-10 h-10 backdrop-blur-md border rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group z-50"
        style={{
          background: 'linear-gradient(140deg, rgba(255,113,103,0.85), rgba(157,140,240,0.85))',
          borderColor: 'rgba(255,255,255,0.4)'
        }}
        title="Hide Reports"
      >
        <div className="relative">
          <svg
            className="w-3 h-3 text-white/80 group-hover:text-white transition-colors duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
          <div className="absolute inset-0 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      </button>

      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-900)' }}>📊 Reports</h2>

            {/* Menu Button */}
            <div className="relative">
               <button
                 onClick={() => {
                   console.log('Menu button clicked, showMenu was:', showMenu);
                   setShowMenu(!showMenu);
                 }}
                className="p-2 rounded-lg transition-colors relative"
                style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid var(--color-border)', color: 'var(--color-text-700)' }}
                title="More options"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 backdrop-blur-md rounded-lg shadow-xl border py-1 z-[60]"
                  style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-soft)' }}
                >
                  <button
                    onClick={() => {
                      generateWeeklySummary();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-2"
                    style={{ color: 'var(--color-text-700)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Weekly Summary
                  </button>

                  <button
                    onClick={() => {
                      exportData();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-2"
                    style={{ color: 'var(--color-text-700)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Data
                  </button>

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    onClick={() => {
                      loadReportData();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-2"
                    style={{ color: 'var(--color-text-700)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Data
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex space-x-1 rounded-lg p-1" style={{ background: 'rgba(148,163,184,0.2)' }}>
            {([
              { id: 'today', label: '📅 Today' },
              { id: 'week', label: '📈 Week' },
              { id: 'overdue', label: '⚠️ Overdue' }
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeView === tab.id
                    ? 'shadow-sm'
                    : ''
                }`}
                style={activeView === tab.id
                  ? { background: 'var(--color-surface)', color: 'var(--color-primary-500)', boxShadow: 'var(--shadow-soft)' }
                  : { color: 'var(--color-text-muted)' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
             <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: 'var(--color-primary-500)' }}></div>
            </div>
          ) : (
            <>
              {activeView === 'today' && todayStats && (
                 <div className="space-y-4">
                  <div className="rounded-xl p-4" style={{ background: 'linear-gradient(120deg, rgba(54,183,180,0.12), rgba(157,140,240,0.12))' }}>
                    <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text-900)' }}>Today&apos;s Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: 'var(--color-secondary-500)' }}>{todayStats.completed}</div>
                        <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: 'var(--color-accent-500)' }}>{todayStats.created}</div>
                        <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Created</div>
                      </div>
                    </div>
                    {todayStats.avgTime > 0 && (
                      <div className="mt-3 text-center">
                        <div className="text-lg font-semibold" style={{ color: 'var(--color-text-900)' }}>
                          {formatTime(todayStats.avgTime)}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Avg. time per task</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeView === 'week' && weeklyReport && (
                 <div className="space-y-4">
                  <div className="rounded-xl p-4" style={{ background: 'linear-gradient(120deg, rgba(157,140,240,0.12), rgba(255,113,103,0.15))' }}>
                    <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text-900)' }}>This Week</h3>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center">
                        <div className="text-xl font-bold" style={{ color: 'var(--color-accent-500)' }}>{weeklyReport.totalCompleted}</div>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold" style={{ color: 'var(--color-secondary-500)' }}>{weeklyReport.totalCreated}</div>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Created</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold" style={{ color: 'var(--color-primary-500)' }}>{Math.round(weeklyReport.productivityScore)}%</div>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Productivity</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium" style={{ color: 'var(--color-text-900)' }}>Daily Breakdown</h4>
                    {weeklyReport.days.map((day) => (
                      <div key={day.date} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(148,163,184,0.16)' }}>
                        <div className="flex items-center space-x-3">
                          <div className="text-sm font-medium" style={{ color: 'var(--color-text-900)' }}>
                            {formatDate(day.date)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="font-medium" style={{ color: 'var(--color-secondary-500)' }}>✅ {day.completed}</span>
                          <span className="font-medium" style={{ color: 'var(--color-accent-500)' }}>➕ {day.created}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeView === 'overdue' && (
                 <div className="space-y-4">
                  <div className="rounded-xl p-4" style={{ background: 'linear-gradient(120deg, rgba(255,113,103,0.15), rgba(255,176,54,0.12))' }}>
                    <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text-900)' }}>⚠️ Overdue Tasks</h3>
                    <div className="text-center">
                      <div className="text-3xl font-bold" style={{ color: 'var(--color-danger)' }}>{overdueTasks.length}</div>
                      <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Tasks past due date</div>
                    </div>
                  </div>

                  {overdueTasks.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium" style={{ color: 'var(--color-text-900)' }}>Overdue Items</h4>
                      {overdueTasks.slice(0, 5).map(task => (
                        <div key={task.id} className="p-3 rounded-lg" style={{ background: 'rgba(255,113,103,0.12)', border: '1px solid rgba(255,113,103,0.2)' }}>
                          <div className="font-medium text-sm" style={{ color: 'var(--color-text-900)' }}>{task.title}</div>
                          <div className="text-xs" style={{ color: 'var(--color-danger)' }}>
                            Due: {task.due_date ? formatDate(task.due_date) : 'No date'}
                          </div>
                        </div>
                      ))}
                      {overdueTasks.length > 5 && (
                        <div className="text-sm text-gray-500 text-center">
                          ...and {overdueTasks.length - 5} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

      </div>
      </div>
    </>
  );
}
