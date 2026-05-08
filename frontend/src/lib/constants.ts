export const CATEGORIES = [
  'Housing',
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Education',
  'Travel',
  'Utilities',
  'Insurance',
  'Personal Care',
  'Fitness',
  'Subscriptions',
  'Gifts & Donations',
  'Investments',
  'Income',
  'Other',
];

export const CATEGORY_COLORS: Record<string, string> = {
  'Housing': '#0052FF',
  'Food & Dining': '#F59E0B',
  'Transportation': '#10B981',
  'Shopping': '#8B5CF6',
  'Entertainment': '#EC4899',
  'Healthcare': '#EF4444',
  'Education': '#3B82F6',
  'Travel': '#14B8A6',
  'Utilities': '#6366F1',
  'Insurance': '#84CC16',
  'Personal Care': '#F97316',
  'Fitness': '#06B6D4',
  'Subscriptions': '#A78BFA',
  'Gifts & Donations': '#FB7185',
  'Investments': '#059669',
  'Income': '#22C55E',
  'Other': '#94A3B8',
};

export const SAMPLE_TRANSACTIONS = [
  { amount: 1200, type: 'expense', category: 'Housing', description: 'Monthly Rent', date: '2024-01-01', is_recurring: true, merchant: 'Landlord' },
  { amount: 85, type: 'expense', category: 'Food & Dining', description: 'Grocery Shopping', date: '2024-01-03', merchant: 'Whole Foods' },
  { amount: 45, type: 'expense', category: 'Food & Dining', description: 'Restaurant Dinner', date: '2024-01-05', merchant: 'Nobu' },
  { amount: 120, type: 'expense', category: 'Transportation', description: 'Monthly Bus Pass', date: '2024-01-06', is_recurring: true },
  { amount: 15, type: 'expense', category: 'Subscriptions', description: 'Netflix', date: '2024-01-07', is_recurring: true, merchant: 'Netflix' },
  { amount: 10, type: 'expense', category: 'Subscriptions', description: 'Spotify', date: '2024-01-07', is_recurring: true, merchant: 'Spotify' },
  { amount: 5000, type: 'income', category: 'Income', description: 'Monthly Salary', date: '2024-01-10', is_recurring: true },
  { amount: 200, type: 'expense', category: 'Shopping', description: 'Clothing Purchase', date: '2024-01-12', merchant: 'H&M' },
  { amount: 30, type: 'expense', category: 'Entertainment', description: 'Movie Tickets', date: '2024-01-14', merchant: 'AMC' },
  { amount: 65, type: 'expense', category: 'Healthcare', description: 'Pharmacy', date: '2024-01-15', merchant: 'CVS' },
  { amount: 100, type: 'expense', category: 'Utilities', description: 'Electricity Bill', date: '2024-01-16', is_recurring: true },
  { amount: 60, type: 'expense', category: 'Utilities', description: 'Internet', date: '2024-01-16', is_recurring: true, merchant: 'Comcast' },
  { amount: 250, type: 'expense', category: 'Food & Dining', description: 'Weekend Brunch & Dinner', date: '2024-01-20', merchant: 'Various' },
  { amount: 350, type: 'expense', category: 'Shopping', description: 'Electronics', date: '2024-01-22', merchant: 'Best Buy' },
  { amount: 1200, type: 'expense', category: 'Housing', description: 'Monthly Rent', date: '2024-02-01', is_recurring: true, merchant: 'Landlord' },
  { amount: 90, type: 'expense', category: 'Food & Dining', description: 'Grocery Shopping', date: '2024-02-04', merchant: 'Trader Joes' },
  { amount: 5000, type: 'income', category: 'Income', description: 'Monthly Salary', date: '2024-02-10', is_recurring: true },
  { amount: 500, type: 'income', category: 'Income', description: 'Freelance Project', date: '2024-02-15' },
  { amount: 180, type: 'expense', category: 'Entertainment', description: 'Concert Tickets', date: '2024-02-16', merchant: 'Ticketmaster' },
  { amount: 1200, type: 'expense', category: 'Housing', description: 'Monthly Rent', date: '2024-03-01', is_recurring: true, merchant: 'Landlord' },
  { amount: 5000, type: 'income', category: 'Income', description: 'Monthly Salary', date: '2024-03-10', is_recurring: true },
  { amount: 800, type: 'expense', category: 'Travel', description: 'Flight Tickets', date: '2024-03-12', merchant: 'Delta Airlines' },
  { amount: 400, type: 'expense', category: 'Travel', description: 'Hotel Stay', date: '2024-03-20', merchant: 'Marriott' },
];

export const formatCurrency = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getChangeClass = (pct: number) => (pct >= 0 ? 'up' : 'down');
