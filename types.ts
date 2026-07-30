
import React from 'react';

export enum ToolTier {
  FREE = 'FREE',
  PRO = 'PRO'
}

export enum ToolCategory {
  WEB = 'WEB',
  TOOLS_2IN1 = '2 EM 1',
  SPECIAL = 'SPECIAL',
  CHATBOTS = 'CHATBOTS',
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  tier: ToolTier;
  icon: React.ReactNode;
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

export interface LogEntry {
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: Date;
}

export interface ScannerResult {
  expected: number;
  found: number;
  missingCount: number;
  missing: number[];
  output: string;
}
export interface Testimonial {
  name: string;
  role: string;
  content: string;
  avatar: string;
  rating: number;
}
