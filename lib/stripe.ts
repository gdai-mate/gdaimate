import Stripe from 'stripe';
import { env } from './env';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export const STRIPE_PLANS = {
  PRO: {
    id: 'price_XXX',
    name: 'Pro',
    amount: 19900, // A$199 in cents
    currency: 'aud',
    interval: 'month',
  },
  ADD_ON_SEAT: {
    id: 'price_YYY',
    name: 'Add-on Seat',
    amount: 2500, // A$25 in cents
    currency: 'aud',
    interval: 'month',
  },
  ENTERPRISE: {
    id: 'price_ZZZ',
    name: 'Enterprise',
    amount: 24900, // A$249 in cents
    currency: 'aud',
    interval: 'month',
  },
} as const;

export type StripePlan = keyof typeof STRIPE_PLANS;

export const createCustomer = async (email: string, name?: string) => {
  return await stripe.customers.create({
    email,
    name,
  });
};

export const createSubscription = async (
  customerId: string,
  priceId: string,
  quantity: number = 1
) => {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [
      {
        price: priceId,
        quantity,
      },
    ],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  });
};

export const updateSubscriptionWithProration = async (
  subscriptionId: string,
  newPriceId: string,
  quantity: number = 1
) => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
        quantity,
      },
    ],
    proration_behavior: 'create_prorations',
  });
};