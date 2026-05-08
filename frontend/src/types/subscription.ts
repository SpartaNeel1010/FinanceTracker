/** Mirrors backend `SubscriptionResponse` / API JSON shape. */
export interface Subscription {
  id: number;
  user_id: number;
  name: string;
  amount: number;
  billing_period: string;
  next_billing_date: string;
  is_active: boolean;
  category: string | null;
  created_at?: string;
}

export type BillingPeriod = 'monthly' | 'yearly' | 'weekly';

export const BILLING_PERIOD_OPTIONS: { value: BillingPeriod; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'weekly', label: 'Weekly' },
];

export interface SubscriptionFormState {
  name: string;
  amount: string;
  billing_period: BillingPeriod;
  next_billing_date: string;
  category: string;
  is_active: boolean;
}

export function emptySubscriptionForm(): SubscriptionFormState {
  return {
    name: '',
    amount: '',
    billing_period: 'monthly',
    next_billing_date: '',
    category: '',
    is_active: true,
  };
}

export function subscriptionToForm(sub: Subscription): SubscriptionFormState {
  const d = sub.next_billing_date.includes('T')
    ? sub.next_billing_date.slice(0, 10)
    : sub.next_billing_date;
  return {
    name: sub.name,
    amount: String(sub.amount),
    billing_period: (['monthly', 'yearly', 'weekly'].includes(sub.billing_period)
      ? sub.billing_period
      : 'monthly') as BillingPeriod,
    next_billing_date: d,
    category: sub.category ?? '',
    is_active: sub.is_active,
  };
}
