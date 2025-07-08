import Anthropic from '@anthropic-ai/sdk';
import { env } from './env';
import { QuoteData, QuoteGenerationRequest, ServiceItem, PropertyDetails } from '@/types/quote';

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

const QUOTE_GENERATION_PROMPT = `
You are an expert building and property maintenance professional. You will analyze property walkthrough transcripts and generate detailed, accurate quotes for maintenance and repair work.

Your task is to:
1. Extract property details from the transcript
2. Identify all work items mentioned
3. Categorize work by type (electrical, plumbing, painting, etc.)
4. Estimate quantities and pricing based on Australian market rates
5. Generate a professional quote structure

IMPORTANT PRICING GUIDELINES (Australian market, 2024):
- Labor rates: $80-120/hour for trades, $50-80/hour for general work
- Materials: Add 20-30% markup on cost price
- Consider property location for pricing adjustments
- Include GST (10%) in final calculations

Extract and structure the following information as JSON:

{
  "clientName": "string (if mentioned, otherwise 'Valued Customer')",
  "property": {
    "address": "string (extract from transcript)",
    "propertyType": "residential|commercial|industrial",
    "size": {
      "squareMeters": number (estimate if not specified),
      "bedrooms": number (if residential),
      "bathrooms": number (if mentioned),
      "floors": number
    },
    "yearBuilt": number (estimate if not specified),
    "condition": "excellent|good|fair|poor|needs_renovation"
  },
  "services": [
    {
      "id": "string (generate unique ID)",
      "category": "string (e.g., 'Electrical', 'Plumbing', 'Painting')",
      "description": "string (detailed description of work)",
      "quantity": number,
      "unit": "string (e.g., 'hours', 'square meters', 'linear meters', 'item')",
      "unitPrice": number (in AUD),
      "totalPrice": number (quantity * unitPrice),
      "notes": "string (any special considerations)"
    }
  ],
  "subtotal": number (sum of all totalPrice),
  "gst": number (subtotal * 0.1),
  "total": number (subtotal + gst),
  "notes": "string (any general notes or assumptions)",
  "validUntil": "string (30 days from now, ISO format)"
}

Be thorough but realistic. If something is unclear from the transcript, make reasonable assumptions and note them. Include appropriate safety margins in pricing.
`;

export const generateQuote = async (request: QuoteGenerationRequest): Promise<QuoteData> => {
  try {
    console.log('Generating quote from transcript...');
    
    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      temperature: 0.1,
      system: QUOTE_GENERATION_PROMPT,
      messages: [
        {
          role: 'user',
          content: `
Transcript of property walkthrough:
"${request.transcript}"

Additional information:
- Client name: ${request.clientName || 'Not specified'}
- Client email: ${request.clientEmail || 'Not specified'}
- Additional notes: ${request.additionalNotes || 'None'}

Please generate a detailed quote based on this information.
          `.trim(),
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Claude');
    }

    // Extract JSON from Claude's response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }

    const quoteData = JSON.parse(jsonMatch[0]);
    
    // Add missing fields and generate ID
    const quote: QuoteData = {
      id: generateQuoteId(),
      clientName: request.clientName || quoteData.clientName || 'Valued Customer',
      clientEmail: request.clientEmail || '',
      clientPhone: '',
      property: quoteData.property,
      services: quoteData.services.map((service: any) => ({
        ...service,
        id: service.id || generateServiceId(),
      })),
      subtotal: quoteData.subtotal,
      gst: quoteData.gst,
      total: quoteData.total,
      validUntil: quoteData.validUntil || getValidUntilDate(),
      notes: quoteData.notes || '',
      createdAt: new Date().toISOString(),
      status: 'draft' as const,
    };

    // Validate and recalculate totals
    validateAndRecalculateQuote(quote);

    console.log(`Quote generated successfully. Total: $${quote.total.toFixed(2)}`);
    return quote;

  } catch (error) {
    console.error('Quote generation failed:', error);
    throw new Error(`Failed to generate quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const generateQuoteWithRetry = async (
  request: QuoteGenerationRequest,
  maxRetries: number = 3
): Promise<QuoteData> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Quote generation attempt ${attempt}/${maxRetries}`);
      return await generateQuote(request);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`Quote generation attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
};

function generateQuoteId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `Q-${timestamp}-${random}`.toUpperCase();
}

function generateServiceId(): string {
  return `S-${Math.random().toString(36).substring(2, 10)}`.toUpperCase();
}

function getValidUntilDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30); // 30 days from now
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

function validateAndRecalculateQuote(quote: QuoteData): void {
  // Recalculate subtotal
  quote.subtotal = quote.services.reduce((sum, service) => {
    service.totalPrice = service.quantity * service.unitPrice;
    return sum + service.totalPrice;
  }, 0);

  // Recalculate GST and total
  quote.gst = Math.round(quote.subtotal * 0.1 * 100) / 100; // Round to 2 decimal places
  quote.total = quote.subtotal + quote.gst;

  // Validate required fields
  if (!quote.property.address) {
    quote.property.address = 'Address to be confirmed';
  }
  
  if (quote.services.length === 0) {
    throw new Error('No services identified from transcript');
  }
}