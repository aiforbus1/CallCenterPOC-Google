/**
 * Public Landing Page Configuration
 * 
 * Safe public configuration values.
 * Contains no secrets, internal IPs, server ports, or private endpoints.
 */

export interface SystemMetricsConfig {
  latencyMs?: number | null;
  uptimePercent?: number | null;
  callsHandled?: number | null;
}

export interface LandingConfig {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  isIndexable: boolean;
  metrics: SystemMetricsConfig | null;
}

export const landingConfig: LandingConfig = {
  // Public contact information configurable via env variables
  contactName: process.env.NEXT_PUBLIC_CONTACT_NAME || "إدارة منظومة الاستجابة الذكية",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "operations@emergency122.local",
  contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "122",

  // Robots meta indexability control: default false (noindex, nofollow)
  isIndexable: process.env.NEXT_PUBLIC_LANDING_INDEXABLE === "true",

  // Performance metrics: must remain null unless explicitly provided by an authorized non-null config
  // Prevents unwarranted claims of unverified metrics.
  metrics: null,
};
