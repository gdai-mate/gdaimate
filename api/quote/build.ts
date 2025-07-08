import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { generateQuotePDF } from '@/lib/pdf-generation';
import { QuoteData } from '@/types/quote';

interface PDFBuildRequest {
  quote: QuoteData;
  companyDetails?: {
    name?: string;
    address?: string[];
    phone?: string;
    email?: string;
    abn?: string;
  };
}

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json() as PDFBuildRequest;
    
    if (!body.quote) {
      return NextResponse.json(
        { error: 'quote data is required' },
        { status: 400 }
      );
    }

    console.log(`Building PDF for quote ${body.quote.id} by user ${user.email}`);

    // Generate PDF
    const pdfBuffer = await generateQuotePDF(body.quote, body.companyDetails);

    console.log(`PDF generated successfully for quote ${body.quote.id}. Size: ${pdfBuffer.length} bytes`);

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quote-${body.quote.id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

// GET endpoint for PDF preview/info
export const GET = withAuth(async (request: NextRequest, { user }) => {
  const { searchParams } = new URL(request.url);
  const quoteId = searchParams.get('quoteId');
  
  if (!quoteId) {
    return NextResponse.json(
      { error: 'quoteId parameter is required' },
      { status: 400 }
    );
  }

  // In a real app, you'd fetch the quote from database
  // For now, return PDF generation info
  return NextResponse.json({
    message: 'Use POST method with quote data to generate PDF',
    quoteId,
    supportedFormats: ['PDF'],
    features: [
      'Professional layout',
      'Company branding',
      'Itemized services',
      'GST calculations',
      'Terms and conditions',
    ],
    estimatedGenerationTime: '2-5 seconds',
  });
});