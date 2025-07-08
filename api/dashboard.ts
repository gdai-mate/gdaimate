import { NextRequest, NextResponse } from 'next/server';
import { withOwnerRole } from '@/lib/api-middleware';
import { calculateDashboardMetrics } from '@/lib/dashboard-metrics';

export const GET = withOwnerRole(async (request: NextRequest, { user }) => {
  try {
    console.log(`Dashboard metrics requested by ${user.email}`);
    
    // Calculate all dashboard metrics
    const metrics = await calculateDashboardMetrics();
    
    // Add timestamp and metadata
    const response = {
      success: true,
      data: metrics,
      meta: {
        generatedAt: new Date().toISOString(),
        generatedBy: user.email,
        cacheTtl: 300, // 5 minutes
        dataFreshness: 'real-time',
      },
      insights: generateInsights(metrics),
    };

    console.log(`Dashboard metrics generated successfully for ${user.email}`);
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache for 5 minutes
      },
    });

  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate dashboard metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

// POST endpoint for triggering metric recalculation
export const POST = withOwnerRole(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json();
    const { forceRefresh = false } = body;

    console.log(`Dashboard refresh triggered by ${user.email}, forceRefresh: ${forceRefresh}`);

    // Always recalculate on POST (useful for manual refresh)
    const metrics = await calculateDashboardMetrics();

    return NextResponse.json({
      success: true,
      message: 'Dashboard metrics refreshed successfully',
      data: metrics,
      meta: {
        refreshedAt: new Date().toISOString(),
        refreshedBy: user.email,
        forced: forceRefresh,
      },
    });

  } catch (error) {
    console.error('Dashboard refresh error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to refresh dashboard metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

function generateInsights(metrics: any): {
  highlights: string[];
  warnings: string[];
  recommendations: string[];
} {
  const insights = {
    highlights: [],
    warnings: [],
    recommendations: [],
  };

  // Revenue insights
  if (metrics.revenueGrowth > 20) {
    insights.highlights.push(`🚀 Revenue growing strongly at ${metrics.revenueGrowth.toFixed(1)}% month-over-month`);
  }
  
  if (metrics.mrr > 0) {
    insights.highlights.push(`💰 Monthly recurring revenue: $${metrics.mrr.toFixed(0)}`);
  }

  // User insights
  if (metrics.churnRolling30d > 15) {
    insights.warnings.push(`⚠️ High churn rate: ${metrics.churnRolling30d.toFixed(1)}% in last 30 days`);
    insights.recommendations.push('Consider customer success outreach for at-risk users');
  }

  if (metrics.newUsersThisMonth > 50) {
    insights.highlights.push(`📈 Strong user growth: ${metrics.newUsersThisMonth} new users this month`);
  }

  // Productivity insights
  if (metrics.hoursSaved > 100) {
    insights.highlights.push(`⏰ AI automation saved ${metrics.hoursSaved.toFixed(0)} hours of manual work`);
  }

  // Task insights
  const completionRate = metrics.projectMetrics.totalTasks > 0 
    ? (metrics.projectMetrics.completedTasks / metrics.projectMetrics.totalTasks) * 100 
    : 0;
    
  if (completionRate > 80) {
    insights.highlights.push(`✅ High task completion rate: ${completionRate.toFixed(0)}%`);
  } else if (completionRate < 50) {
    insights.warnings.push(`⚠️ Low task completion rate: ${completionRate.toFixed(0)}%`);
    insights.recommendations.push('Review project timelines and resource allocation');
  }

  // Quote insights
  if (metrics.quoteConversionRate > 70) {
    insights.highlights.push(`💼 Excellent quote conversion: ${metrics.quoteConversionRate}%`);
  } else if (metrics.quoteConversionRate < 50) {
    insights.warnings.push(`📉 Quote conversion below target: ${metrics.quoteConversionRate}%`);
    insights.recommendations.push('Analyze quote pricing and follow-up processes');
  }

  // Performance insights
  if (metrics.systemUptime < 99) {
    insights.warnings.push(`🔧 System uptime below target: ${metrics.systemUptime}%`);
    insights.recommendations.push('Review infrastructure reliability and monitoring');
  }

  // Add general recommendations if no specific ones
  if (insights.recommendations.length === 0) {
    insights.recommendations.push('Continue monitoring key metrics for optimization opportunities');
  }

  return insights;
}