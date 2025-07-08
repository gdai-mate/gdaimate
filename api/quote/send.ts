import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { generateQuotePDF } from '@/lib/pdf-generation';
import { stripe } from '@/lib/stripe';
import { QuoteData } from '@/types/quote';

interface QuoteSendRequest {
  quote: QuoteData;
  recipientEmail?: string; // Override quote.clientEmail if needed
  message?: string;
  includePaymentLink?: boolean;
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
    const body = await request.json() as QuoteSendRequest;
    
    if (!body.quote) {
      return NextResponse.json(
        { error: 'quote data is required' },
        { status: 400 }
      );
    }

    const recipientEmail = body.recipientEmail || body.quote.clientEmail;
    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'recipient email is required' },
        { status: 400 }
      );
    }

    console.log(`Sending quote ${body.quote.id} to ${recipientEmail} by user ${user.email}`);

    // Generate PDF
    const pdfBuffer = await generateQuotePDF(body.quote, body.companyDetails);

    // Create Stripe payment link if requested
    let paymentLink = null;
    if (body.includePaymentLink !== false) { // Default to true
      paymentLink = await createStripePaymentLink(body.quote);
    }

    // Send email with PDF attachment
    const emailResult = await sendQuoteEmail({
      recipientEmail,
      recipientName: body.quote.clientName,
      quote: body.quote,
      pdfBuffer,
      paymentLink,
      customMessage: body.message,
      senderName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email,
    });

    console.log(`Quote email sent successfully to ${recipientEmail}`);

    // Update quote status (in real app, save to database)
    body.quote.status = 'sent';

    return NextResponse.json({
      success: true,
      emailSent: true,
      recipientEmail,
      quote: {
        id: body.quote.id,
        status: body.quote.status,
        total: body.quote.total,
        validUntil: body.quote.validUntil,
      },
      paymentLink: paymentLink ? {
        url: paymentLink.url,
        id: paymentLink.id,
      } : null,
      emailDetails: {
        messageId: emailResult.messageId,
        sentAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Quote sending error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send quote',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

async function createStripePaymentLink(quote: QuoteData) {
  try {
    // Create a product for this quote
    const product = await stripe.products.create({
      name: `Property Services Quote - ${quote.id}`,
      description: `Quote for property at ${quote.property.address}`,
      metadata: {
        quoteId: quote.id,
        propertyAddress: quote.property.address,
      },
    });

    // Create a price for the total amount
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(quote.total * 100), // Convert to cents
      currency: 'aud',
      metadata: {
        quoteId: quote.id,
      },
    });

    // Create payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: 'https://your-domain.com/payment-success?quote_id=' + quote.id,
        },
      },
      metadata: {
        quoteId: quote.id,
        clientEmail: quote.clientEmail,
      },
    });

    return paymentLink;
  } catch (error) {
    console.error('Failed to create Stripe payment link:', error);
    throw new Error('Could not create payment link');
  }
}

async function sendQuoteEmail({
  recipientEmail,
  recipientName,
  quote,
  pdfBuffer,
  paymentLink,
  customMessage,
  senderName,
}: {
  recipientEmail: string;
  recipientName: string;
  quote: QuoteData;
  pdfBuffer: Buffer;
  paymentLink?: any;
  customMessage?: string;
  senderName: string;
}) {
  // For now, this is a stub that logs the email details
  // In production, you'd integrate with SendGrid, AWS SES, etc.
  
  console.log('📧 Sending quote email...');
  console.log(`To: ${recipientEmail} (${recipientName})`);
  console.log(`From: ${senderName}`);
  console.log(`Subject: Quote ${quote.id} - Property Services`);
  console.log(`PDF Size: ${pdfBuffer.length} bytes`);
  console.log(`Payment Link: ${paymentLink?.url || 'Not included'}`);
  
  const emailContent = generateEmailContent({
    recipientName,
    quote,
    paymentLink,
    customMessage,
    senderName,
  });
  
  console.log('Email Content:');
  console.log(emailContent);
  
  // TODO: Implement actual email sending with SendGrid
  // const msg = {
  //   to: recipientEmail,
  //   from: 'quotes@gdaimate.com',
  //   subject: `Quote ${quote.id} - Property Services`,
  //   html: emailContent,
  //   attachments: [
  //     {
  //       content: pdfBuffer.toString('base64'),
  //       filename: `quote-${quote.id}.pdf`,
  //       type: 'application/pdf',
  //       disposition: 'attachment',
  //     },
  //   ],
  // };
  // await sgMail.send(msg);
  
  return {
    success: true,
    messageId: `stub-${Date.now()}`,
  };
}

function generateEmailContent({
  recipientName,
  quote,
  paymentLink,
  customMessage,
  senderName,
}: {
  recipientName: string;
  quote: QuoteData;
  paymentLink?: any;
  customMessage?: string;
  senderName: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quote ${quote.id}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Quote for Property Services</h2>
        
        <p>Dear ${recipientName},</p>
        
        <p>Thank you for your interest in our property services. Please find attached your detailed quote for the work discussed.</p>
        
        ${customMessage ? `<div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;"><p><strong>Personal Message:</strong><br>${customMessage}</p></div>` : ''}
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2c3e50;">Quote Summary</h3>
            <p><strong>Quote ID:</strong> ${quote.id}</p>
            <p><strong>Property:</strong> ${quote.property.address}</p>
            <p><strong>Total Services:</strong> ${quote.services.length}</p>
            <p><strong>Total Amount:</strong> $${quote.total.toFixed(2)} AUD (inc. GST)</p>
            <p><strong>Valid Until:</strong> ${new Date(quote.validUntil).toLocaleDateString('en-AU')}</p>
        </div>
        
        ${paymentLink ? `
        <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentLink.url}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                💳 Pay Now - $${quote.total.toFixed(2)}
            </a>
            <p style="font-size: 14px; color: #666; margin-top: 10px;">
                Secure payment via Stripe • No account required
            </p>
        </div>
        ` : ''}
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p>If you have any questions about this quote, please don't hesitate to contact me.</p>
            <p>Best regards,<br><strong>${senderName}</strong><br>G'dAI Mate Property Services</p>
        </div>
        
        <div style="font-size: 12px; color: #666; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
            <p>This quote was generated using AI-powered property assessment technology.</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}