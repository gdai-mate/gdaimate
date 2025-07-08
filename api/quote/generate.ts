import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { generateQuoteWithRetry } from '@/lib/quote-generation';

interface QuoteGenerationRequest {
  transcript: string;
  clientName?: string;
  clientEmail?: string;
  additionalNotes?: string;
  propertyAddress?: string;
}

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json() as QuoteGenerationRequest;
    
    if (!body.transcript) {
      return NextResponse.json(
        { error: 'transcript is required' },
        { status: 400 }
      );
    }

    if (body.transcript.length < 50) {
      return NextResponse.json(
        { error: 'Transcript too short. Please provide a more detailed property walkthrough.' },
        { status: 400 }
      );
    }

    console.log(`Generating quote for user ${user.email}. Transcript length: ${body.transcript.length} characters`);

    // Generate quote using Claude with retry logic
    const quote = await generateQuoteWithRetry({
      transcript: body.transcript,
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      additionalNotes: [
        body.additionalNotes,
        body.propertyAddress ? `Property address: ${body.propertyAddress}` : null,
      ].filter(Boolean).join('\n'),
    });

    console.log(`Quote generated successfully: ${quote.id}, Total: $${quote.total.toFixed(2)}`);

    // Store quote in database here (future implementation)
    // await saveQuoteToDatabase(quote, user.id);

    return NextResponse.json({
      success: true,
      quote: {
        id: quote.id,
        clientName: quote.clientName,
        clientEmail: quote.clientEmail,
        property: quote.property,
        services: quote.services,
        subtotal: quote.subtotal,
        gst: quote.gst,
        total: quote.total,
        validUntil: quote.validUntil,
        notes: quote.notes,
        createdAt: quote.createdAt,
        status: quote.status,
      },
      summary: {
        totalServices: quote.services.length,
        categories: [...new Set(quote.services.map(s => s.category))],
        estimatedDuration: estimateProjectDuration(quote.services),
      },
      nextSteps: {
        buildPDF: `/api/quote/build`,
        sendQuote: `/api/quote/send`,
        editQuote: `/api/quote/edit`,
      },
    });

  } catch (error) {
    console.error('Quote generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate quote',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      },
      { status: 500 }
    );
  }
});

function estimateProjectDuration(services: any[]): string {
  // Simple estimation based on service types and quantities
  const totalHours = services.reduce((total, service) => {
    if (service.unit === 'hours') {
      return total + service.quantity;
    }
    // Rough estimates for other units
    if (service.unit === 'square meters') {
      return total + (service.quantity * 0.5); // 0.5 hours per sqm
    }
    if (service.unit === 'linear meters') {
      return total + (service.quantity * 0.25); // 0.25 hours per linear meter
    }
    if (service.unit === 'item') {
      return total + service.quantity; // 1 hour per item
    }
    return total + 1; // Default 1 hour
  }, 0);

  if (totalHours <= 8) {
    return '1 day';
  } else if (totalHours <= 40) {
    return `${Math.ceil(totalHours / 8)} days`;
  } else {
    return `${Math.ceil(totalHours / 40)} weeks`;
  }
}