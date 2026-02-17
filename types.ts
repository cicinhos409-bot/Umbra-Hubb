
export enum ToolTier {
  FREE = 'FREE',
  PRO = 'PRO',
  TURBO = 'TURBO'
}

export enum ToolCategory {
  WEB = 'WEB',
  MOTOR_SUPREMO = 'MOTOR SUPREMO',
  TOOLS_2IN1 = '2 EM 1',
  SPECIAL = 'SPECIAL'
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  tier: ToolTier;
  icon: string;
  category?: ToolCategory;
}

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaLink?: string;
  popular?: boolean;
  tier: ToolTier;
}

export interface Testimonial {
  name: string;
  role: string;
  content: string;
  avatar: string;
  rating: number;
}
