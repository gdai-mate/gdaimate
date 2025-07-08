import { env } from './env';

export const sendSMSAlert = async (message: string) => {
  if (!env.TWILIO_SID || !env.TWILIO_TOKEN || !env.ALERT_PHONE) {
    console.warn('Twilio not configured, skipping SMS alert');
    return;
  }

  try {
    // Using fetch instead of Twilio SDK to keep dependencies minimal
    const auth = Buffer.from(`${env.TWILIO_SID}:${env.TWILIO_TOKEN}`).toString('base64');
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: env.ALERT_PHONE,
        From: '+1234567890', // Replace with your Twilio number
        Body: message,
      }),
    });

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.status}`);
    }

    console.log('SMS alert sent successfully');
  } catch (error) {
    console.error('Failed to send SMS alert:', error);
  }
};