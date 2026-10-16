import React from 'react';
import {
  ArrowLeftRight,
  BookOpen,
  Briefcase,
  Car,
  Coffee,
  CreditCard,
  Film,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  MoreHorizontal,
  PiggyBank,
  Plane,
  PlusCircle,
  Receipt,
  ShoppingBag,
  Smartphone,
  Store,
  Tag,
  TrendingUp,
  Utensils,
  Wallet,
  Wrench,
} from 'lucide-react';

export const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Home,
  Film,
  HeartPulse,
  GraduationCap,
  MoreHorizontal,
  Briefcase,
  Gift,
  Store,
  TrendingUp,
  PlusCircle,
  Wallet,
  ArrowLeftRight,
  Coffee,
  CreditCard,
  Laptop,
  PiggyBank,
  Plane,
  Smartphone,
  BookOpen,
  Wrench,
  Tag,
};

export const AVAILABLE_CATEGORY_ICONS = [
  { name: 'Utensils', label: 'Makanan' },
  { name: 'Coffee', label: 'Minuman / Kafe' },
  { name: 'Car', label: 'Transportasi' },
  { name: 'ShoppingBag', label: 'Belanja' },
  { name: 'Receipt', label: 'Tagihan' },
  { name: 'Home', label: 'Rumah / Kos' },
  { name: 'Film', label: 'Hiburan' },
  { name: 'HeartPulse', label: 'Kesehatan' },
  { name: 'GraduationCap', label: 'Pendidikan' },
  { name: 'Briefcase', label: 'Gaji / Kerja' },
  { name: 'Gift', label: 'Bonus / Hadiah' },
  { name: 'Store', label: 'Usaha' },
  { name: 'TrendingUp', label: 'Investasi' },
  { name: 'PiggyBank', label: 'Tabungan' },
  { name: 'Smartphone', label: 'Pulsa / Digital' },
  { name: 'Plane', label: 'Perjalanan' },
  { name: 'Wrench', label: 'Servis' },
  { name: 'Tag', label: 'Umum' },
];

export function CategoryIcon({
  name,
  className = 'h-4 w-4',
}: {
  name?: string | null;
  className?: string;
}) {
  const IconComponent = (name && CATEGORY_ICON_MAP[name]) || Tag;
  return <IconComponent className={className} />;
}
