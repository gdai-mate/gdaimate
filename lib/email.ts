import Stripe from 'stripe';

interface InvoiceEmailData {
  customerEmail: string;
  invoice: Stripe.Invoice;
  customerName?: string;
}

export const sendInvoiceEmail = async ({
  customerEmail,
  invoice,
  customerName = 'Customer',
}: InvoiceEmailData) => {
  console.log('📧 Sending invoice email...');
  console.log(`To: ${customerEmail}`);
  console.log(`Customer: ${customerName}`);
  console.log(`Invoice ID: ${invoice.id}`);
  console.log(`Amount: $${(invoice.amount_paid || 0) / 100}`);
  console.log(`Status: ${invoice.status}`);
  
  // TODO: Implement with SendGrid
  // This is a stub that will be replaced with actual email sending
  return {
    success: true,
    messageId: `stub-${Date.now()}`,
  };
};

export const sendPaymentFailedEmail = async ({
  customerEmail,
  invoice,
  customerName = 'Customer',
}: InvoiceEmailData) => {
  console.log('🚨 Sending payment failed email...');
  console.log(`To: ${customerEmail}`);
  console.log(`Customer: ${customerName}`);
  console.log(`Invoice ID: ${invoice.id}`);
  console.log(`Amount: $${(invoice.amount_due || 0) / 100}`);
  
  // TODO: Implement with SendGrid
  // This is a stub that will be replaced with actual email sending
  return {
    success: true,
    messageId: `stub-failed-${Date.now()}`,
  };
};