import { redirect } from 'next/navigation';

/** Stripe cancel URL lands here — send shoppers back to the storefront cart. */
export default function CartRedirectPage() {
  redirect('/?open=cart');
}
