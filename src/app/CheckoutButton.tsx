"use client";
import { loadStripe } from "@stripe/stripe-js";

export default function CheckoutButton() {
  async function handleClick() {
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
    const res = await fetch("/api/checkout", {
      method: "POST",
      body: JSON.stringify({ priceId: "price_12345" }), // replace with your real Price ID later
    });
    const { id } = await res.json();
    await stripe!.redirectToCheckout({ sessionId: id });
  }
  return <button onClick={handleClick}>Subscribe</button>;
}
