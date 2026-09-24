import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Film,
  GraduationCap,
  HeartPulse,
  HelpCircle,
  Briefcase,
  Home,
  Plane,
  Coffee,
  Smartphone,
  Gift,
  Zap,
  TrendingUp,
  Tag,
  LucideProps,
} from 'lucide-react';

export const CATEGORY_ICON_LIST = [
  { name: 'Utensils', label: 'Food & Dining', component: Utensils },
  { name: 'Car', label: 'Transport', component: Car },
  { name: 'ShoppingBag', label: 'Shopping', component: ShoppingBag },
  { name: 'Receipt', label: 'Bills & Utilities', component: Receipt },
  { name: 'Film', label: 'Entertainment', component: Film },
  { name: 'GraduationCap', label: 'Education', component: GraduationCap },
  { name: 'HeartPulse', label: 'Health & Wellness', component: HeartPulse },
  { name: 'HelpCircle', label: 'Other', component: HelpCircle },
  { name: 'Briefcase', label: 'Work & Business', component: Briefcase },
  { name: 'Home', label: 'Housing & Rent', component: Home },
  { name: 'Plane', label: 'Travel', component: Plane },
  { name: 'Coffee', label: 'Cafe & Drinks', component: Coffee },
  { name: 'Smartphone', label: 'Tech & Gadgets', component: Smartphone },
  { name: 'Gift', label: 'Gifts & Charity', component: Gift },
  { name: 'Zap', label: 'Electricity / Energy', component: Zap },
  { name: 'TrendingUp', label: 'Investments', component: TrendingUp },
];

export function renderCategoryIcon(iconName: string | null | undefined, props?: LucideProps) {
  const match = CATEGORY_ICON_LIST.find((i) => i.name === iconName);
  const IconComponent = match ? match.component : Tag;
  return <IconComponent {...props} />;
}
