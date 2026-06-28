import {
  Camera,
  Gamepad2,
  Headphones,
  Laptop,
  type LucideIcon,
  Monitor,
  Package,
  Refrigerator,
  Smartphone,
  Tablet,
  Tv,
  Watch,
} from "lucide-react-native";

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
