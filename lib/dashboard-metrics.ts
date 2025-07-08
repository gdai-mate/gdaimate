import { stripe } from './stripe';
import { clerkClient } from '@clerk/nextjs/server';
import { getSheetMetrics } from './google-sheets';

export interface DashboardMetrics {
  // Revenue metrics
  mrr: number; // Monthly Recurring Revenue
  totalRevenue: number;
  revenueGrowth: number; // % change from last month
  
  // User metrics
  usersOnline: number;
  totalUsers: number;
  newUsersThisMonth: number;
  churnRolling30d: number; // % of users who churned in last 30 days
  
  // Quote metrics
  quotesToday: number;
  quotesThisMonth: number;
  quoteConversionRate: number; // % of quotes that become paid jobs
  
  // Productivity metrics
  hoursSaved: number; // Total hours saved using AI vs manual quotes
  tasksCompleted: number;
  activeProjects: number;
  
  // Performance metrics
  avgQuoteGenerationTime: number; // seconds
  avgTranscriptionTime: number; // seconds
  systemUptime: number; // %
  
  // Financial breakdown
  stripeRevenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    last30Days: number;
  };
  
  // Task metrics from Google Sheets
  projectMetrics: {
    totalTasks: number;
    completedTasks: number;
    tasksByStatus: Record<string, number>;
    tasksByPriority: Record<string, number>;
    tasksByAssignee: Record<string, number>;
  };
}

export const calculateDashboardMetrics = async (): Promise<DashboardMetrics> => {
  console.log('Calculating dashboard metrics...');
  
  // Get current date ranges
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    // Fetch metrics in parallel for better performance
    const [
      stripeMetrics,
      userMetrics,
      taskMetrics,
      quoteMetrics,
    ] = await Promise.all([
      calculateStripeMetrics(startOfToday, startOfMonth, startOfLastMonth, endOfLastMonth, thirtyDaysAgo),
      calculateUserMetrics(startOfMonth, thirtyDaysAgo),
      getSheetMetrics(),
      calculateQuoteMetrics(startOfToday, startOfMonth),
    ]);

    // Calculate derived metrics
    const revenueGrowth = stripeMetrics.lastMonthRevenue > 0 
      ? ((stripeMetrics.thisMonthRevenue - stripeMetrics.lastMonthRevenue) / stripeMetrics.lastMonthRevenue) * 100
      : 0;

    const churnRolling30d = userMetrics.totalUsers > 0 
      ? (userMetrics.churnedUsers / userMetrics.totalUsers) * 100 
      : 0;

    // Estimate hours saved (assumes manual quote takes 2 hours vs 10 minutes with AI)
    const hoursSaved = quoteMetrics.totalQuotes * 1.83; // 1 hour 50 minutes saved per quote

    const dashboard: DashboardMetrics = {
      // Revenue
      mrr: stripeMetrics.mrr,
      totalRevenue: stripeMetrics.totalRevenue,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      
      // Users
      usersOnline: userMetrics.activeUsers,
      totalUsers: userMetrics.totalUsers,
      newUsersThisMonth: userMetrics.newUsersThisMonth,
      churnRolling30d: Math.round(churnRolling30d * 100) / 100,
      
      // Quotes
      quotesToday: quoteMetrics.quotesToday,
      quotesThisMonth: quoteMetrics.quotesThisMonth,
      quoteConversionRate: quoteMetrics.conversionRate,
      
      // Productivity
      hoursSaved: Math.round(hoursSaved * 10) / 10,
      tasksCompleted: taskMetrics.tasksByStatus['Completed'] || 0,
      activeProjects: getActiveProjectsCount(taskMetrics),
      
      // Performance
      avgQuoteGenerationTime: 45, // Mock data - would track this in production
      avgTranscriptionTime: 120, // Mock data
      systemUptime: 99.8, // Mock data - would get from monitoring service
      
      // Financial breakdown
      stripeRevenue: {
        today: stripeMetrics.todayRevenue,
        thisWeek: stripeMetrics.thisWeekRevenue,
        thisMonth: stripeMetrics.thisMonthRevenue,
        last30Days: stripeMetrics.last30DaysRevenue,
      },
      
      // Tasks
      projectMetrics: {
        totalTasks: taskMetrics.totalTasks,
        completedTasks: taskMetrics.tasksByStatus['Completed'] || 0,
        tasksByStatus: taskMetrics.tasksByStatus,
        tasksByPriority: taskMetrics.tasksByPriority,
        tasksByAssignee: taskMetrics.tasksByAssignee,
      },
    };

    console.log('Dashboard metrics calculated successfully');
    return dashboard;

  } catch (error) {
    console.error('Error calculating dashboard metrics:', error);
    throw new Error(`Failed to calculate metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

async function calculateStripeMetrics(
  startOfToday: Date,
  startOfMonth: Date,
  startOfLastMonth: Date,
  endOfLastMonth: Date,
  thirtyDaysAgo: Date
) {
  try {
    // Get payment intents for different time periods
    const [todayCharges, thisMonthCharges, lastMonthCharges, last30DaysCharges, activeSubscriptions] = await Promise.all([
      stripe.charges.list({ created: { gte: Math.floor(startOfToday.getTime() / 1000) }, limit: 100 }),
      stripe.charges.list({ created: { gte: Math.floor(startOfMonth.getTime() / 1000) }, limit: 100 }),
      stripe.charges.list({ 
        created: { 
          gte: Math.floor(startOfLastMonth.getTime() / 1000),
          lte: Math.floor(endOfLastMonth.getTime() / 1000)
        } 
      }, limit: 100),
      stripe.charges.list({ created: { gte: Math.floor(thirtyDaysAgo.getTime() / 1000) }, limit: 100 }),
      stripe.subscriptions.list({ status: 'active', limit: 100 }),
    ]);

    const todayRevenue = todayCharges.data.reduce((sum, charge) => sum + (charge.amount || 0), 0) / 100;
    const thisMonthRevenue = thisMonthCharges.data.reduce((sum, charge) => sum + (charge.amount || 0), 0) / 100;
    const lastMonthRevenue = lastMonthCharges.data.reduce((sum, charge) => sum + (charge.amount || 0), 0) / 100;
    const last30DaysRevenue = last30DaysCharges.data.reduce((sum, charge) => sum + (charge.amount || 0), 0) / 100;
    
    // Calculate MRR from active subscriptions
    const mrr = activeSubscriptions.data.reduce((sum, sub) => {
      const price = sub.items.data[0]?.price;
      if (price) {
        const amount = (price.unit_amount || 0) / 100;
        return sum + amount;
      }
      return sum;
    }, 0);

    // Calculate total revenue (simplified - in production you'd have better tracking)
    const totalRevenue = last30DaysRevenue * 12; // Rough estimate

    // Calculate this week revenue (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekCharges = await stripe.charges.list({ 
      created: { gte: Math.floor(weekAgo.getTime() / 1000) }, 
      limit: 100 
    });
    const thisWeekRevenue = thisWeekCharges.data.reduce((sum, charge) => sum + (charge.amount || 0), 0) / 100;

    return {
      todayRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      last30DaysRevenue,
      thisWeekRevenue,
      mrr,
      totalRevenue,
    };
  } catch (error) {
    console.error('Error calculating Stripe metrics:', error);
    // Return zero values if Stripe is not accessible
    return {
      todayRevenue: 0,
      thisMonthRevenue: 0,
      lastMonthRevenue: 0,
      last30DaysRevenue: 0,
      thisWeekRevenue: 0,
      mrr: 0,
      totalRevenue: 0,
    };
  }
}

async function calculateUserMetrics(startOfMonth: Date, thirtyDaysAgo: Date) {
  try {
    const [allUsers, newUsers] = await Promise.all([
      clerkClient.users.getUserList({ limit: 500 }),
      clerkClient.users.getUserList({ 
        createdAtSince: startOfMonth.getTime(),
        limit: 100 
      }),
    ]);

    // Calculate active users (signed in within last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUsers = allUsers.data.filter(user => 
      user.lastSignInAt && new Date(user.lastSignInAt) > weekAgo
    ).length;

    // Calculate churn (users who haven't signed in for 30+ days but were active before)
    const churnedUsers = allUsers.data.filter(user => 
      user.lastSignInAt && 
      new Date(user.lastSignInAt) < thirtyDaysAgo &&
      new Date(user.createdAt) < thirtyDaysAgo
    ).length;

    return {
      totalUsers: allUsers.totalCount,
      newUsersThisMonth: newUsers.data.length,
      activeUsers,
      churnedUsers,
    };
  } catch (error) {
    console.error('Error calculating user metrics:', error);
    return {
      totalUsers: 0,
      newUsersThisMonth: 0,
      activeUsers: 0,
      churnedUsers: 0,
    };
  }
}

async function calculateQuoteMetrics(startOfToday: Date, startOfMonth: Date) {
  // In a real app, you'd track quotes in a database
  // For now, return mock data based on typical usage
  const estimatedQuotesToday = Math.floor(Math.random() * 10) + 5; // 5-15 quotes per day
  const estimatedQuotesThisMonth = estimatedQuotesToday * new Date().getDate();
  const estimatedTotalQuotes = estimatedQuotesThisMonth * 3; // Assume 3 months of operation
  
  return {
    quotesToday: estimatedQuotesToday,
    quotesThisMonth: estimatedQuotesThisMonth,
    totalQuotes: estimatedTotalQuotes,
    conversionRate: 65.5, // 65.5% of quotes become paying customers
  };
}

function getActiveProjectsCount(taskMetrics: any): number {
  // Count unique job IDs that have tasks in progress or pending
  // This is a simplified calculation - in production you'd track this properly
  const inProgressTasks = taskMetrics.tasksByStatus['In Progress'] || 0;
  const pendingTasks = taskMetrics.tasksByStatus['Pending'] || 0;
  
  // Rough estimate: assume 5 tasks per project on average
  return Math.ceil((inProgressTasks + pendingTasks) / 5);
}