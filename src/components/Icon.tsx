import {
  Anchor,
  BatteryLow,
  Cloudy,
  Compass,
  Feather,
  Flame,
  Hand,
  Heart,
  HeartHandshake,
  MessageCircle,
  Mountain,
  Scale,
  Sparkles,
  Sun,
  Sunrise,
  Undo2,
  User,
  Wind,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";
import type { Topic } from "../content";

const map: Record<Topic["icon"], ComponentType<LucideProps>> = {
  sun: Sun,
  "cloud-fog": Cloudy,
  user: User,
  "heart-handshake": HeartHandshake,
  flame: Flame,
  wind: Wind,
  sunrise: Sunrise,
  "undo-2": Undo2,
  mountain: Mountain,
  "battery-low": BatteryLow,
  heart: Heart,
  scale: Scale,
  anchor: Anchor,
  hand: Hand,
  sparkles: Sparkles,
  compass: Compass,
  "message-circle": MessageCircle,
  feather: Feather,
};

export function TopicIcon({ name, size = 18 }: { name: Topic["icon"]; size?: number }) {
  const C = map[name];
  return <C size={size} strokeWidth={2} aria-hidden="true" />;
}
