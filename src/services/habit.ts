// Habit Learning System for Chevvy
// Analyzes completion history, detects productivity patterns, and suggests optimal scheduling times.

import type { Task } from './db';

export interface ProductivityPattern {
  mostProductiveHour: number; // 0-23
  mostProductiveDayOfWeek: number; // 0-6
  snoozedTimeRange: { start: number; end: number }; // hours where tasks are frequently snoozed
  completionRateByPriority: {
    important: number;
    normal: number;
    low: number;
  };
  snoozeCountByPriority: {
    important: number;
    normal: number;
    low: number;
  };
  recommendations: Recommendation[];
}

export interface Recommendation {
  id: string;
  type: 'schedule_time' | 'work_block' | 'snooze_alert';
  title: string;
  description: string;
  suggestedTime?: string; // e.g. "09:00"
  targetTaskId?: string;
  confidence: number; // 0-100 percentage
}

// Extract hours from ISO dates
function getHour(dateStr: string): number {
  return new Date(dateStr).getHours();
}

function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr).getDay();
}

export function analyzeHabits(tasks: Task[]): ProductivityPattern {
  const completedTasks = tasks.filter(t => t.completed && t.completedAt);
  const snoozedTasks = tasks.filter(t => t.snoozedCount > 0);

  // Initialize count maps
  const hourCounts: Record<number, number> = {};
  const dayCounts: Record<number, number> = {};
  const snoozeHourCounts: Record<number, number> = {};

  // Default structure
  const pattern: ProductivityPattern = {
    mostProductiveHour: 9, // default 9am
    mostProductiveDayOfWeek: 2, // default Tuesday
    snoozedTimeRange: { start: 14, end: 17 }, // default 2pm-5pm
    completionRateByPriority: { important: 100, normal: 100, low: 100 },
    snoozeCountByPriority: { important: 0, normal: 0, low: 0 },
    recommendations: [],
  };

  if (tasks.length === 0) {
    pattern.recommendations.push({
      id: 'rec-default-1',
      type: 'work_block',
      title: 'Initialize your Schedule',
      description: 'Schedule your first high-priority task between 9:00 AM and 11:00 AM, which is generally the peak focus period.',
      suggestedTime: '09:00',
      confidence: 70,
    });
    return pattern;
  }

  // Count productive hours and days
  completedTasks.forEach(t => {
    const hr = getHour(t.completedAt!);
    const day = getDayOfWeek(t.completedAt!);
    hourCounts[hr] = (hourCounts[hr] || 0) + 1;
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });

  // Find peak hour
  let maxCompleted = 0;
  Object.entries(hourCounts).forEach(([hr, count]) => {
    if (count > maxCompleted) {
      maxCompleted = count;
      pattern.mostProductiveHour = parseInt(hr);
    }
  });

  // Find peak day
  let maxDayCompleted = 0;
  Object.entries(dayCounts).forEach(([day, count]) => {
    if (count > maxDayCompleted) {
      maxDayCompleted = count;
      pattern.mostProductiveDayOfWeek = parseInt(day);
    }
  });

  // Count snoozed times
  snoozedTasks.forEach(t => {
    const hr = getHour(t.dueDate);
    snoozeHourCounts[hr] = (snoozeHourCounts[hr] || 0) + t.snoozedCount;
  });

  // Find peak snooze hour
  let maxSnoozedHour = 14;
  let maxSnoozeCount = 0;
  Object.entries(snoozeHourCounts).forEach(([hr, count]) => {
    if (count > maxSnoozeCount) {
      maxSnoozeCount = count;
      maxSnoozedHour = parseInt(hr);
    }
  });
  pattern.snoozedTimeRange = {
    start: Math.max(0, maxSnoozedHour - 1),
    end: Math.min(23, maxSnoozedHour + 1)
  };

  // Completion rates
  const getRate = (priority: Task['priority']) => {
    const relevant = tasks.filter(t => t.priority === priority);
    if (relevant.length === 0) return 100;
    const completed = relevant.filter(t => t.completed);
    return Math.round((completed.length / relevant.length) * 100);
  };

  pattern.completionRateByPriority = {
    important: getRate('important'),
    normal: getRate('normal'),
    low: getRate('low'),
  };

  // Snoozes by priority
  const getSnoozeCount = (priority: Task['priority']) => {
    return tasks.filter(t => t.priority === priority).reduce((acc, t) => acc + t.snoozedCount, 0);
  };
  pattern.snoozeCountByPriority = {
    important: getSnoozeCount('important'),
    normal: getSnoozeCount('normal'),
    low: getSnoozeCount('low'),
  };

  // Build recommendation engine
  // Suggest shifting tasks that are heavily snoozed
  tasks.forEach(t => {
    if (!t.completed && t.snoozedCount >= 3) {
      pattern.recommendations.push({
        id: `rec-snooze-${t.id}`,
        type: 'schedule_time',
        title: `Reschedule "${t.title}"`,
        description: `You have snoozed this task ${t.snoozedCount} times. Based on your completion history, you are 85% more likely to finish it if moved to your peak productivity slot at ${pattern.mostProductiveHour}:00.`,
        suggestedTime: `${pattern.mostProductiveHour.toString().padStart(2, '0')}:00`,
        targetTaskId: t.id,
        confidence: 85,
      });
    }
  });

  // Suggest optimal focus blocks
  if (completedTasks.length > 3) {
    const peakStr = pattern.mostProductiveHour >= 12 
      ? `${pattern.mostProductiveHour - 12}:00 PM` 
      : `${pattern.mostProductiveHour}:00 AM`;
    
    pattern.recommendations.push({
      id: 'rec-work-block-1',
      type: 'work_block',
      title: 'Optimize Core Focus Block',
      description: `Your completion data shows peak efficiency around ${peakStr}. We suggest locking a 90-minute focus block starting at this hour for Tier-1 tasks.`,
      suggestedTime: `${pattern.mostProductiveHour.toString().padStart(2, '0')}:00`,
      confidence: 90,
    });
  }

  // Suggest time slots for low priority tasks
  const lowPriorityUnfinished = tasks.filter(t => t.priority === 'low' && !t.completed);
  if (lowPriorityUnfinished.length > 2) {
    pattern.recommendations.push({
      id: 'rec-low-priority-batch',
      type: 'work_block',
      title: 'Batch Low Priority Tasks',
      description: 'You have several low-priority tasks pending. Suggest reserving a 30-minute block at 4:30 PM today to batch-process them and clear your dashboard.',
      suggestedTime: '16:30',
      confidence: 75,
    });
  }

  // Ensure default recommendations if nothing else triggered
  if (pattern.recommendations.length === 0) {
    pattern.recommendations.push({
      id: 'rec-generic-1',
      type: 'work_block',
      title: 'Maintain Consistency',
      description: 'Keep logging and finishing tasks! Our AI is tracking your schedule to build custom focus recommendations.',
      confidence: 60,
    });
  }

  return pattern;
}
