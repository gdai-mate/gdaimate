import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { createProjectFromQuote } from '@/lib/task-management';
import { QuoteData } from '@/types/quote';

interface QuoteAcceptRequest {
  quote: QuoteData;
  assignmentOptions?: {
    defaultAssignee?: string;
    bufferDays?: number;
    autoAssignByCategory?: Record<string, string>;
  };
  clientConfirmation?: {
    acceptedAt: string;
    clientSignature?: string;
    paymentMethod?: 'stripe' | 'invoice' | 'cash';
    paymentStatus?: 'pending' | 'paid' | 'partial';
  };
}

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json() as QuoteAcceptRequest;
    
    if (!body.quote) {
      return NextResponse.json(
        { error: 'quote data is required' },
        { status: 400 }
      );
    }

    if (!body.quote.id) {
      return NextResponse.json(
        { error: 'quote must have a valid ID' },
        { status: 400 }
      );
    }

    console.log(`Quote ${body.quote.id} accepted by ${user.email}. Creating project...`);

    // Create project from the accepted quote
    const projectResult = await createProjectFromQuote(
      body.quote,
      body.assignmentOptions
    );

    // Update quote status (in a real app, you'd save this to database)
    body.quote.status = 'accepted';

    // Log the acceptance for tracking
    console.log(`Project created from quote ${body.quote.id}:`, {
      tasksCreated: projectResult.tasksCreated,
      estimatedDuration: projectResult.projectSummary.estimatedDuration,
      totalHours: projectResult.projectSummary.totalHours,
      categories: projectResult.projectSummary.categories,
    });

    // Return success response with project details
    return NextResponse.json({
      success: true,
      message: 'Quote accepted and project created successfully',
      quote: {
        id: body.quote.id,
        status: body.quote.status,
        clientName: body.quote.clientName,
        total: body.quote.total,
        acceptedAt: body.clientConfirmation?.acceptedAt || new Date().toISOString(),
      },
      project: {
        jobId: body.quote.id,
        tasksCreated: projectResult.tasksCreated,
        summary: projectResult.projectSummary,
        nextSteps: [
          'Tasks have been added to Google Sheets',
          'Team leads will be notified of new assignments',
          'Project manager will schedule site visit',
          'Materials procurement will begin',
        ],
      },
      tracking: {
        googleSheetsUpdated: true,
        notificationsQueued: true,
        dashboardMetricsWillUpdate: true,
      },
      links: {
        viewTasks: `/projects/${body.quote.id}/tasks`,
        projectDashboard: `/projects/${body.quote.id}`,
        clientPortal: `/clients/${body.quote.clientEmail}/project/${body.quote.id}`,
      },
    });

  } catch (error) {
    console.error('Quote acceptance error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to accept quote and create project',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

// GET endpoint to check if a quote can be accepted
export const GET = withAuth(async (request: NextRequest, { user }) => {
  const { searchParams } = new URL(request.url);
  const quoteId = searchParams.get('quoteId');
  
  if (!quoteId) {
    return NextResponse.json(
      { error: 'quoteId parameter is required' },
      { status: 400 }
    );
  }

  // In a real app, you'd check the quote status from database
  // For now, return acceptance criteria
  return NextResponse.json({
    canAccept: true,
    quoteId,
    requirements: [
      'Quote must be within validity period',
      'Client must have confirmed acceptance',
      'Payment method must be confirmed',
      'All terms must be agreed upon',
    ],
    estimatedProcessingTime: '2-5 minutes',
    willCreate: {
      tasksInGoogleSheets: true,
      projectDashboard: true,
      teamNotifications: true,
      clientCommunications: true,
    },
  });
});