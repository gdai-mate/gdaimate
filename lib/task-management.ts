import { QuoteData, ServiceItem } from '@/types/quote';
import { TaskRow, addMultipleTasksToSheet } from './google-sheets';

export interface TaskGenerationOptions {
  defaultAssignee?: string;
  bufferDays?: number; // Days to add to estimated completion
  autoAssignByCategory?: Record<string, string>; // category -> assignee mapping
}

const DEFAULT_OPTIONS: TaskGenerationOptions = {
  defaultAssignee: 'Team Lead',
  bufferDays: 2,
  autoAssignByCategory: {
    'Electrical': 'Mike (Electrician)',
    'Plumbing': 'Sarah (Plumber)',
    'Painting': 'Alex (Painter)',
    'Carpentry': 'David (Carpenter)',
    'Cleaning': 'Clean Team',
    'Landscaping': 'Garden Crew',
    'General': 'Handyman Joe',
  },
};

export const generateTasksFromQuote = (
  quote: QuoteData,
  options: TaskGenerationOptions = {}
): TaskRow[] => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const tasks: TaskRow[] = [];
  
  // Calculate base due date (quote creation + buffer days)
  const baseDate = new Date(quote.createdAt);
  baseDate.setDate(baseDate.getDate() + (opts.bufferDays || 2));
  
  // Add pre-work tasks
  tasks.push({
    jobId: quote.id,
    task: 'Schedule site visit and confirm access',
    assignee: opts.defaultAssignee || 'Project Manager',
    status: 'Pending',
    due: formatDate(baseDate),
    category: 'Admin',
    priority: 'High',
    estimatedHours: 1,
    notes: `Client: ${quote.clientName}, Property: ${quote.property.address}`,
  });
  
  tasks.push({
    jobId: quote.id,
    task: 'Procure materials and equipment',
    assignee: opts.defaultAssignee || 'Project Manager',
    status: 'Pending',
    due: formatDate(addDays(baseDate, 1)),
    category: 'Procurement',
    priority: 'Medium',
    estimatedHours: 2,
    notes: `Total value: $${quote.total.toFixed(2)} - Review services list for materials needed`,
  });

  // Convert each service to tasks
  let currentDueDate = new Date(baseDate);
  currentDueDate.setDate(currentDueDate.getDate() + 2); // Start work after procurement

  quote.services.forEach((service, index) => {
    const assignee = opts.autoAssignByCategory?.[service.category] || opts.defaultAssignee || 'General Team';
    const priority = determinePriority(service);
    const estimatedHours = estimateHours(service);
    
    // For multi-day tasks, spread them out
    if (estimatedHours > 8) {
      currentDueDate.setDate(currentDueDate.getDate() + Math.ceil(estimatedHours / 8));
    }

    tasks.push({
      jobId: quote.id,
      task: service.description,
      assignee,
      status: 'Pending',
      due: formatDate(currentDueDate),
      category: service.category,
      priority,
      estimatedHours,
      notes: `${service.quantity} ${service.unit} @ $${service.unitPrice.toFixed(2)} each. ${service.notes || ''}`.trim(),
    });

    // Add buffer time between different categories
    if (index < quote.services.length - 1 && 
        quote.services[index + 1].category !== service.category) {
      currentDueDate.setDate(currentDueDate.getDate() + 1);
    }
  });

  // Add post-work tasks
  const finalDueDate = new Date(currentDueDate);
  finalDueDate.setDate(finalDueDate.getDate() + 1);

  tasks.push({
    jobId: quote.id,
    task: 'Quality inspection and client walkthrough',
    assignee: opts.defaultAssignee || 'Project Manager',
    status: 'Pending',
    due: formatDate(finalDueDate),
    category: 'QA',
    priority: 'High',
    estimatedHours: 2,
    notes: 'Final inspection with client before project completion',
  });

  tasks.push({
    jobId: quote.id,
    task: 'Invoice and payment collection',
    assignee: 'Accounts',
    status: 'Pending',
    due: formatDate(addDays(finalDueDate, 1)),
    category: 'Admin',
    priority: 'High',
    estimatedHours: 1,
    notes: `Total amount: $${quote.total.toFixed(2)}`,
  });

  return tasks;
};

export const createProjectFromQuote = async (
  quote: QuoteData,
  options: TaskGenerationOptions = {}
): Promise<{
  success: boolean;
  tasksCreated: number;
  projectSummary: {
    totalTasks: number;
    estimatedDuration: string;
    totalHours: number;
    categories: string[];
  };
}> => {
  try {
    console.log(`Creating project from quote ${quote.id}`);
    
    // Generate tasks from the quote
    const tasks = generateTasksFromQuote(quote, options);
    
    // Add all tasks to Google Sheets
    await addMultipleTasksToSheet(tasks);
    
    // Calculate project summary
    const totalHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
    const categories = [...new Set(tasks.map(task => task.category).filter(Boolean))];
    const workDays = Math.ceil(totalHours / 8);
    
    console.log(`Project created successfully: ${tasks.length} tasks, ${totalHours} hours estimated`);
    
    return {
      success: true,
      tasksCreated: tasks.length,
      projectSummary: {
        totalTasks: tasks.length,
        estimatedDuration: workDays === 1 ? '1 day' : `${workDays} days`,
        totalHours,
        categories,
      },
    };
  } catch (error) {
    console.error('Failed to create project from quote:', error);
    throw new Error(`Project creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper functions
function determinePriority(service: ServiceItem): TaskRow['priority'] {
  // Safety-related work gets high priority
  if (/electrical|gas|plumbing|safety|emergency/i.test(service.description)) {
    return 'High';
  }
  
  // Structural work gets medium priority
  if (/structural|foundation|roof|wall/i.test(service.description)) {
    return 'Medium';
  }
  
  // High-value work gets medium priority
  if (service.totalPrice > 1000) {
    return 'Medium';
  }
  
  return 'Low';
}

function estimateHours(service: ServiceItem): number {
  // If the service is already measured in hours, use that
  if (service.unit === 'hours') {
    return service.quantity;
  }
  
  // Otherwise estimate based on common units
  switch (service.unit) {
    case 'square meters':
    case 'sqm':
      return Math.max(1, Math.round(service.quantity * 0.5)); // 0.5 hours per sqm
    case 'linear meters':
    case 'm':
      return Math.max(1, Math.round(service.quantity * 0.25)); // 0.25 hours per linear meter
    case 'item':
    case 'items':
      return Math.max(1, service.quantity); // 1 hour per item
    default:
      // Estimate based on price - roughly $100/hour labor
      return Math.max(1, Math.round(service.totalPrice / 100));
  }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export const getProjectStatus = (tasks: TaskRow[]): {
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  progress: number; // 0-100
  completedTasks: number;
  totalTasks: number;
} => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
  const onHoldTasks = tasks.filter(task => task.status === 'On Hold').length;
  
  let status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  
  if (completedTasks === totalTasks) {
    status = 'Completed';
  } else if (onHoldTasks > 0) {
    status = 'On Hold';
  } else if (inProgressTasks > 0 || completedTasks > 0) {
    status = 'In Progress';
  } else {
    status = 'Not Started';
  }
  
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  return {
    status,
    progress,
    completedTasks,
    totalTasks,
  };
};