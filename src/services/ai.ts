// AI Note Scheduling parser for Chevvy
// Scans note content for deadlines, times, and task keywords (in English, Telugu, and Hindi)
// Suggests schedule creations for the user to approve.

import { generateId } from './db';
import type { Note, Task } from './db';

export interface AISuggestedTask {
  id: string;
  noteId: string;
  noteTitle: string;
  title: string;
  priority: Task['priority'];
  dueDate: string; // ISO date string
  rawText: string; // The phrase extracted from the note
  language: 'en' | 'te' | 'hi';
}

// Simple natural language helper to parse common date-time strings
function parseExtractedDate(phrase: string, lang: 'en' | 'te' | 'hi'): Date {
  const now = new Date();
  const targetDate = new Date(now);

  const cleanPhrase = phrase.toLowerCase().trim();

  // Language: English
  if (lang === 'en') {
    if (cleanPhrase.includes('tomorrow')) {
      targetDate.setDate(now.getDate() + 1);
    } else if (cleanPhrase.includes('tonight')) {
      targetDate.setHours(20, 0, 0, 0); // 8:00 PM today
      return targetDate;
    } else if (cleanPhrase.includes('next monday')) {
      const daysUntilMonday = (1 + 7 - now.getDay()) % 7 || 7;
      targetDate.setDate(now.getDate() + daysUntilMonday);
    } else if (cleanPhrase.includes('friday')) {
      const daysUntilFriday = (5 + 7 - now.getDay()) % 7 || 7;
      targetDate.setDate(now.getDate() + daysUntilFriday);
    } else if (cleanPhrase.includes('next week')) {
      targetDate.setDate(now.getDate() + 7);
    }
  } 
  // Language: Telugu ("repu" = tomorrow, "nedu" = today, "sainthram" = evening, "udayam" = morning)
  else if (lang === 'te') {
    if (cleanPhrase.includes('repu') || cleanPhrase.includes('రేపు')) {
      targetDate.setDate(now.getDate() + 1);
    } else if (cleanPhrase.includes('nedu') || cleanPhrase.includes('నేడు')) {
      // today
    } else if (cleanPhrase.includes('vachhe varam') || cleanPhrase.includes('వచ్చే వారం')) {
      targetDate.setDate(now.getDate() + 7);
    }
  } 
  // Language: Hindi ("kal" = tomorrow/yesterday, "aaj" = today, "shyam" = evening, "subah" = morning)
  else if (lang === 'hi') {
    if (cleanPhrase.includes('kal') || cleanPhrase.includes('कल')) {
      targetDate.setDate(now.getDate() + 1);
    } else if (cleanPhrase.includes('aaj') || cleanPhrase.includes('आज')) {
      // today
    } else if (cleanPhrase.includes('agle hafte') || cleanPhrase.includes('अगले हफ्ते')) {
      targetDate.setDate(now.getDate() + 7);
    }
  }

  // Parse time triggers: e.g. "at 5pm", "by 10 AM", "shyam 6 baje", "sainthram 5 gantalaku"
  // Try to find hour numbers
  const hourMatch = cleanPhrase.match(/(\d+)\s*(pm|am|baje|gantalu|గంటలు)/i);
  if (hourMatch) {
    let hr = parseInt(hourMatch[1]);
    const isPm = hourMatch[2].toLowerCase() === 'pm' || cleanPhrase.includes('pm') || cleanPhrase.includes('shyam') || cleanPhrase.includes('evening') || cleanPhrase.includes('sainthram') || cleanPhrase.includes('సాయంత్రం');
    
    if (isPm && hr < 12) hr += 12;
    if (!isPm && hr === 12) hr = 0;
    
    targetDate.setHours(hr, 0, 0, 0);
  } else {
    // Default to 10:00 AM if no time found
    targetDate.setHours(10, 0, 0, 0);
  }

  return targetDate;
}

export function detectTasksFromNote(note: Note): AISuggestedTask[] {
  const suggestions: AISuggestedTask[] = [];
  const textContent = note.content.replace(/<[^>]*>/g, ' '); // Strip HTML tags to inspect plain text

  // Regex patterns to match reminders
  // 1. English: "Remind me to [task] on [day] at [time]" or "[Task] by [day] at [time]"
  // 2. Telugu: "[task] [time/day] [verb]" (e.g. "repu meeting udayam 10 ki")
  // 3. Hindi: "[task] [day] ko [time] baje" (e.g. "aaj sham 6 baje doctor ke paas jana hai")

  const englishPatterns = [
    /remind me to\s+([^,.\n]+?)\s+(on|by|this|tomorrow|tonight)\s+([^,.\n]+)/gi,
    /need to\s+([^,.\n]+?)\s+(on|by|this|tomorrow|tonight)\s+([^,.\n]+)/gi,
    /schedule\s+([^,.\n]+?)\s+(for|on|at)\s+([^,.\n]+)/gi,
  ];

  const teluguPatterns = [
    /([^,.\n]+?)\s+(repu|nedu|sainthram|udayam|రేపు|నేడు|సాయంత్రం|ఉదయం)\s+([^,.\n]*?(cheyyali|vellali|చేయాలి|వెళ్ళాలి))/gi,
  ];

  const hindiPatterns = [
    /([^,.\n]+?)\s+(aaj|kal|shyam|subah|आज|कल|शाम|सुबह)\s+([^,.\n]*?(karna hai|jana hai|करना है|जाना है))/gi,
  ];

  // Try English matches
  englishPatterns.forEach(regex => {
    let match;
    while ((match = regex.exec(textContent)) !== null) {
      const taskTitle = match[1].trim();
      const timeContext = (match[2] + ' ' + match[3]).trim();
      
      const dueDate = parseExtractedDate(timeContext, 'en');
      suggestions.push({
        id: generateId(),
        noteId: note.id,
        noteTitle: note.title,
        title: taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1),
        priority: taskTitle.toLowerCase().includes('urgent') || taskTitle.toLowerCase().includes('important') ? 'important' : 'normal',
        dueDate: dueDate.toISOString(),
        rawText: match[0],
        language: 'en'
      });
    }
  });

  // Try Telugu matches
  teluguPatterns.forEach(regex => {
    let match;
    while ((match = regex.exec(textContent)) !== null) {
      const taskBody = match[1].trim();
      const timeWord = match[2].trim();
      const actionWord = match[3].trim();
      
      const dueDate = parseExtractedDate(timeWord + ' ' + actionWord, 'te');
      suggestions.push({
        id: generateId(),
        noteId: note.id,
        noteTitle: note.title,
        title: `${taskBody} (${actionWord})`,
        priority: 'normal',
        dueDate: dueDate.toISOString(),
        rawText: match[0],
        language: 'te'
      });
    }
  });

  // Try Hindi matches
  hindiPatterns.forEach(regex => {
    let match;
    while ((match = regex.exec(textContent)) !== null) {
      const taskBody = match[1].trim();
      const timeWord = match[2].trim();
      const actionWord = match[3].trim();
      
      const dueDate = parseExtractedDate(timeWord + ' ' + actionWord, 'hi');
      suggestions.push({
        id: generateId(),
        noteId: note.id,
        noteTitle: note.title,
        title: `${taskBody} (${actionWord})`,
        priority: 'normal',
        dueDate: dueDate.toISOString(),
        rawText: match[0],
        language: 'hi'
      });
    }
  });

  // Fallback heuristic: If note contains checklists or action items but no matching triggers,
  // check for lines starting with "- [ ]" or list numbers
  if (suggestions.length === 0) {
    const lines = textContent.split('\n');
    lines.forEach(line => {
      const cleanLine = line.replace(/^[-*\s\d.()]+/, '').trim();
      if (cleanLine.length > 5 && (cleanLine.toLowerCase().includes('meeting') || cleanLine.toLowerCase().includes('deadline') || cleanLine.toLowerCase().includes('due'))) {
        // Find if any dates are mentioned
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0); // Default tomorrow noon
        
        suggestions.push({
          id: generateId(),
          noteId: note.id,
          noteTitle: note.title,
          title: cleanLine,
          priority: cleanLine.toLowerCase().includes('urgent') ? 'important' : 'normal',
          dueDate: tomorrow.toISOString(),
          rawText: line,
          language: 'en'
        });
      }
    });
  }

  return suggestions;
}
