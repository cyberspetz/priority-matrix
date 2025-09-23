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
  },
};

export const PRIORITY_ORDER: TaskPriority[] = ['p1', 'p2', 'p3', 'p4'];

export const getPriorityMeta = (priority: TaskPriority): PriorityMeta => PRIORITY_META[priority] ?? PRIORITY_META.p3;
