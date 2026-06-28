import {
  Ban,
  Camera,
  Gamepad2,
  Headphones,
  Laptop,
  type LucideIcon,
  Mail,
  Monitor,
  Package,
  Plus,
  Refrigerator,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  ShoppingCart,
  Smartphone,
  Tablet,
  Tv,
  Watch,
  Wrench,
  FileText,
} from "lucide-react";
import type { WarrantyStatus } from "@repo/validators";

/** Device category → icon (falls back to a generic package box). */
const categoryIcons: Record<string, LucideIcon> = {
  Laptop,
  Phone: Smartphone,
  TV: Tv,
  Tablet,
  Headphones,
  Smartwatch: Watch,
  Camera,
  Console: Gamepad2,
  Monitor,
  Appliance: Refrigerator,
};

export function categoryIcon(category: string): LucideIcon {
  return categoryIcons[category] ?? Package;
}

/** Warranty status → icon, for metric cards and badges. */
export const statusIcons: Record<WarrantyStatus, LucideIcon> = {
  active: ShieldCheck,
  expiring_soon: ShieldAlert,
  expired: ShieldX,
};

/** Warranty timeline event type → icon. */
const eventIcons: Record<string, LucideIcon> = {
  purchase: ShoppingCart,
  registered: FileText,
  claim: Mail,
  repair: Wrench,
  extended: Plus,
  expired: Ban,
};

export function eventIcon(type: string): LucideIcon {
  return eventIcons[type] ?? Package;
}
