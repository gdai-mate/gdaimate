import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { env } from '@/lib/env';
import { sendSMSAlert } from '@/lib/twilio';
import { sendInvoiceEmail, sendPaymentFailedEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing webhook secret');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`✅ Invoice paid: ${invoice.id}`);
  
  try {
    const customer = await stripe.customers.retrieve(invoice.customer as string);
    
    if (customer.deleted) {
      console.error('Customer was deleted');
      return;
    }

    await sendInvoiceEmail({
      customerEmail: customer.email!,
      customerName: customer.name || undefined,
      invoice,
    });

    console.log(`Invoice email sent for ${invoice.id}`);
  } catch (error) {
    console.error('Error processing invoice.paid:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`❌ Invoice payment failed: ${invoice.id}`);
  
  try {
    const customer = await stripe.customers.retrieve(invoice.customer as string);
    
    if (customer.deleted) {
      console.error('Customer was deleted');
      return;
    }

    // Send SMS alert to admin
    await sendSMSAlert(
      `🚨 Payment failed for customer ${customer.email} - Invoice: ${invoice.id} - Amount: $${(invoice.amount_due || 0) / 100}`
    );

    // Send email to customer
    await sendPaymentFailedEmail({
      customerEmail: customer.email!,
      customerName: customer.name || undefined,
      invoice,
    });

    console.log(`Payment failure notifications sent for ${invoice.id}`);
  } catch (error) {
    console.error('Error processing invoice.payment_failed:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`🔄 Subscription updated: ${subscription.id}`);
  
  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    if (customer.deleted) {
      console.error('Customer was deleted');
      return;
    }

    // Log subscription changes for now
    console.log(`Customer: ${customer.email}`);
    console.log(`Status: ${subscription.status}`);
    console.log(`Items:`, subscription.items.data.map(item => ({
      price: item.price.id,
      quantity: item.quantity,
    })));

    // TODO: Update user subscription status in your database
    // TODO: Send subscription change confirmation email
    
  } catch (error) {
    console.error('Error processing customer.subscription.updated:', error);
  }
}