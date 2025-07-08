import { google } from 'googleapis';
import { env } from './env';

const sheets = google.sheets('v4');

// Initialize Google Auth
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export interface TaskRow {
  jobId: string;
  task: string;
  assignee: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'On Hold';
  due: string; // ISO date string
  category?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  estimatedHours?: number;
  notes?: string;
}

export interface SheetConfig {
  sheetId: string;
  range: string;
  headers: string[];
}

const DEFAULT_SHEET_CONFIG: SheetConfig = {
  sheetId: env.GOOGLE_SHEET_ID,
  range: 'Tasks!A:I', // JobId | Task | Assignee | Status | Due | Category | Priority | Hours | Notes
  headers: ['JobId', 'Task', 'Assignee', 'Status', 'Due', 'Category', 'Priority', 'EstimatedHours', 'Notes'],
};

export const initializeSheet = async (config: SheetConfig = DEFAULT_SHEET_CONFIG): Promise<void> => {
  try {
    const authClient = await auth.getClient();
    
    // Check if sheet exists and has headers
    const response = await sheets.spreadsheets.values.get({
      auth: authClient,
      spreadsheetId: config.sheetId,
      range: 'Tasks!A1:I1',
    });

    // If no data or headers don't match, initialize with headers
    if (!response.data.values || response.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        auth: authClient,
        spreadsheetId: config.sheetId,
        range: 'Tasks!A1:I1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [config.headers],
        },
      });
      
      console.log('Initialized Google Sheet with headers');
    }
  } catch (error) {
    console.error('Failed to initialize Google Sheet:', error);
    throw new Error('Google Sheets initialization failed');
  }
};

export const addTaskToSheet = async (
  task: TaskRow,
  config: SheetConfig = DEFAULT_SHEET_CONFIG
): Promise<void> => {
  try {
    const authClient = await auth.getClient();
    
    // Ensure sheet is initialized
    await initializeSheet(config);
    
    // Prepare row data according to headers
    const rowData = [
      task.jobId,
      task.task,
      task.assignee,
      task.status,
      task.due,
      task.category || '',
      task.priority || 'Medium',
      task.estimatedHours?.toString() || '',
      task.notes || '',
    ];

    // Append the new row
    await sheets.spreadsheets.values.append({
      auth: authClient,
      spreadsheetId: config.sheetId,
      range: config.range,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [rowData],
      },
    });

    console.log(`Added task to sheet: ${task.jobId} - ${task.task}`);
  } catch (error) {
    console.error('Failed to add task to Google Sheet:', error);
    throw new Error(`Failed to add task to sheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const addMultipleTasksToSheet = async (
  tasks: TaskRow[],
  config: SheetConfig = DEFAULT_SHEET_CONFIG
): Promise<void> => {
  try {
    const authClient = await auth.getClient();
    
    // Ensure sheet is initialized
    await initializeSheet(config);
    
    // Prepare all rows data
    const rowsData = tasks.map(task => [
      task.jobId,
      task.task,
      task.assignee,
      task.status,
      task.due,
      task.category || '',
      task.priority || 'Medium',
      task.estimatedHours?.toString() || '',
      task.notes || '',
    ]);

    // Append all rows at once
    await sheets.spreadsheets.values.append({
      auth: authClient,
      spreadsheetId: config.sheetId,
      range: config.range,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: rowsData,
      },
    });

    console.log(`Added ${tasks.length} tasks to sheet`);
  } catch (error) {
    console.error('Failed to add multiple tasks to Google Sheet:', error);
    throw new Error(`Failed to add tasks to sheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const updateTaskStatus = async (
  jobId: string,
  newStatus: TaskRow['status'],
  config: SheetConfig = DEFAULT_SHEET_CONFIG
): Promise<void> => {
  try {
    const authClient = await auth.getClient();
    
    // First, find the row with the matching jobId
    const response = await sheets.spreadsheets.values.get({
      auth: authClient,
      spreadsheetId: config.sheetId,
      range: config.range,
    });

    if (!response.data.values) {
      throw new Error('No data found in sheet');
    }

    // Find the row index (skip header row)
    const rows = response.data.values;
    const targetRowIndex = rows.findIndex((row, index) => index > 0 && row[0] === jobId);
    
    if (targetRowIndex === -1) {
      throw new Error(`Task with jobId ${jobId} not found`);
    }

    // Update the status (column D, index 3)
    const actualRowNumber = targetRowIndex + 1; // +1 because sheets are 1-indexed
    await sheets.spreadsheets.values.update({
      auth: authClient,
      spreadsheetId: config.sheetId,
      range: `Tasks!D${actualRowNumber}:D${actualRowNumber}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[newStatus]],
      },
    });

    console.log(`Updated task ${jobId} status to ${newStatus}`);
  } catch (error) {
    console.error('Failed to update task status in Google Sheet:', error);
    throw new Error(`Failed to update task status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getTasksFromSheet = async (
  config: SheetConfig = DEFAULT_SHEET_CONFIG
): Promise<TaskRow[]> => {
  try {
    const authClient = await auth.getClient();
    
    const response = await sheets.spreadsheets.values.get({
      auth: authClient,
      spreadsheetId: config.sheetId,
      range: config.range,
    });

    if (!response.data.values || response.data.values.length <= 1) {
      return []; // No data or only headers
    }

    // Skip header row and convert to TaskRow objects
    const tasks: TaskRow[] = response.data.values.slice(1).map((row: any[]) => ({
      jobId: row[0] || '',
      task: row[1] || '',
      assignee: row[2] || '',
      status: (row[3] || 'Pending') as TaskRow['status'],
      due: row[4] || '',
      category: row[5] || undefined,
      priority: (row[6] || 'Medium') as TaskRow['priority'],
      estimatedHours: row[7] ? parseInt(row[7], 10) : undefined,
      notes: row[8] || undefined,
    }));

    return tasks;
  } catch (error) {
    console.error('Failed to get tasks from Google Sheet:', error);
    throw new Error(`Failed to get tasks from sheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getSheetMetrics = async (
  config: SheetConfig = DEFAULT_SHEET_CONFIG
): Promise<{
  totalTasks: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  tasksByAssignee: Record<string, number>;
}> => {
  try {
    const tasks = await getTasksFromSheet(config);
    
    const metrics = {
      totalTasks: tasks.length,
      tasksByStatus: {},
      tasksByPriority: {},
      tasksByAssignee: {},
    };

    tasks.forEach(task => {
      // Count by status
      metrics.tasksByStatus[task.status] = (metrics.tasksByStatus[task.status] || 0) + 1;
      
      // Count by priority
      if (task.priority) {
        metrics.tasksByPriority[task.priority] = (metrics.tasksByPriority[task.priority] || 0) + 1;
      }
      
      // Count by assignee
      if (task.assignee) {
        metrics.tasksByAssignee[task.assignee] = (metrics.tasksByAssignee[task.assignee] || 0) + 1;
      }
    });

    return metrics;
  } catch (error) {
    console.error('Failed to get sheet metrics:', error);
    throw new Error(`Failed to get sheet metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};