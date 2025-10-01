import type { TaskPriority } from './supabaseClient';

interface PriorityMeta {
  name: string;
  flagLabel: string;
  description: string;
  circleBorder: string;
  circleFill: string;
  completedFill: string;
  badgeTone: string;
  badgeText: string;
  pillTone: string;
  iconFill: string;
  dotFill: string;
  badgeFillColor?: string;
  badgeTextColor?: string;
  circleBorderColor?: string;
  circleFillColor?: string;
  completedFillColor?: string;
}

export const PRIORITY_META: Record<TaskPriority, PriorityMeta> = {
  p1: {
    name: 'Critical',
    flagLabel: 'P1',
    description: 'Needs immediate attention',
    circleBorder: 'border-rose-400',
    circleFill: 'bg-rose-100',
    completedFill: 'bg-rose-500',
    badgeTone: 'bg-rose-100',
    badgeText: 'text-rose-700',
    pillTone: 'border border-rose-200 bg-rose-50 text-rose-700',
    iconFill: 'text-rose-500',
    dotFill: 'bg-rose-500',
    badgeFillColor: 'rgba(255, 113, 103, 0.18)',
    badgeTextColor: '#f45b52',
    circleBorderColor: '#f45b52',
    circleFillColor: 'rgba(255, 113, 103, 0.18)',
    completedFillColor: '#f45b52',
  },
  p2: {
    name: 'High',
    flagLabel: 'P2',
    description: 'Plan soon',
    circleBorder: 'border-amber-400',
    circleFill: 'bg-amber-100',
    completedFill: 'bg-amber-500',
    badgeTone: 'bg-amber-100',
    badgeText: 'text-amber-700',
    pillTone: 'border border-amber-200 bg-amber-50 text-amber-700',
    iconFill: 'text-amber-500',
    dotFill: 'bg-amber-500',
    badgeFillColor: 'rgba(245, 158, 11, 0.18)',
    badgeTextColor: '#c2410c',
    circleBorderColor: '#f59e0b',
    circleFillColor: 'rgba(245, 158, 11, 0.2)',
    completedFillColor: '#f59e0b',
  },
  p3: {
    name: 'Normal',
    flagLabel: 'P3',
    description: 'Steady progress',
    circleBorder: 'border-sky-400',
    circleFill: 'bg-sky-100',
    completedFill: 'bg-sky-500',
    badgeTone: 'bg-sky-100',
    badgeText: 'text-sky-700',
    pillTone: 'border border-sky-200 bg-sky-50 text-sky-700',
    iconFill: 'text-sky-500',
    dotFill: 'bg-sky-500',
    badgeFillColor: 'rgba(37, 99, 235, 0.18)',
    badgeTextColor: '#2563eb',
    circleBorderColor: '#2563eb',
    circleFillColor: 'rgba(37, 99, 235, 0.18)',
    completedFillColor: '#2563eb',
  },
  p4: {
    name: 'Low',
    flagLabel: 'P4',
    description: 'No rush',
    circleBorder: 'border-slate-400',
    circleFill: 'bg-slate-100',
    completedFill: 'bg-slate-500',
    badgeTone: 'bg-slate-100',
    badgeText: 'text-slate-700',
    pillTone: 'border border-slate-200 bg-slate-50 text-slate-600',
    iconFill: 'text-slate-500',
    dotFill: 'bg-slate-500',
    badgeFillColor: 'rgba(148, 163, 184, 0.2)',
    badgeTextColor: '#475569',
    circleBorderColor: '#94a3b8',
    circleFillColor: 'rgba(148, 163, 184, 0.2)',
    completedFillColor: '#94a3b8',
  },
};

export const PRIORITY_ORDER: TaskPriority[] = ['p1', 'p2', 'p3', 'p4'];

export const getPriorityMeta = (priority: TaskPriority): PriorityMeta => PRIORITY_META[priority] ?? PRIORITY_META.p3;
