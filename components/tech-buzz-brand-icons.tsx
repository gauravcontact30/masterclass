import React from "react";

interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

/**
 * Authentic SVG Icons for Tech Buzz:
 * Proprietary Content Formats (No third-party names):
 * - RadarFormatIcon (Global Engineering Radar)
 * - FirehoseFormatIcon (Daily Tech Firehose)
 * - EditorialFormatIcon (Editorial Deep Dives)
 * - CodeLabsFormatIcon (Community Code Labs)
 * - SeriesStacksFormatIcon (Architecture Series & Stacks)
 * - AudioDispatchFormatIcon (Audio Dispatches & Briefs)
 * - BlueprintsFormatIcon (Production Blueprints & Metrics)
 * - PressFormatIcon (Special Edition Technical Press)
 * - MatrixFormatIcon (Platform Matrix & Architecture Taxonomy)
 *
 * Plus authentic Technology & Company SVG Icons:
 * React, Next.js, TypeScript, Rust, PostgreSQL, AWS, Docker, Kubernetes, Python, Anthropic MCP, eBPF
 */

export function RadarFormatIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 1 10 10" />
      <path d="M12 6a6 6 0 0 1 6 6" />
      <circle cx="12" cy="12" r="2" />
      <line x1="12" y1="12" x2="18" y2="6" />
    </svg>
  );
}

export function FirehoseFormatIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 2C8.5 7 5 9.5 5 14C5 17.866 8.13401 21 12 21C15.866 21 19 17.866 19 14C19 9.5 15.5 7 12 2Z" fill="#E11D48" />
      <path d="M12 8C10.5 11 8.5 12.5 8.5 15C8.5 16.933 10.067 18.5 12 18.5C13.933 18.5 15.5 16.933 15.5 15C15.5 12.5 13.5 11 12 8Z" fill="#FEE2E2" />
    </svg>
  );
}

export function EditorialFormatIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M6 6h10" />
      <path d="M6 10h10" />
      <path d="M6 14h6" />
    </svg>
  );
}

export function CodeLabsFormatIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#7C3AED" />
      <path d="M8 9L5 12L8 15M16 9L19 12L16 15M13 7L11 17" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SeriesStacksFormatIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m12 2 10 5-10 5L2 7l10-5Z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </svg>
  );
}

export function AudioDispatchFormatIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4.9 19.1A10 10 0 1 1 19.1 4.9" />
      <path d="M7.8 16.2A6 6 0 1 1 16.2 7.8" />
      <circle cx="12" cy="12" r="2" fill="#D97706" />
    </svg>
  );
}

export function BlueprintsFormatIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="3" y1="9" x2="21" y2="9" strokeDasharray="2 2" />
      <line x1="9" y1="3" x2="9" y2="21" strokeDasharray="2 2" />
      <path d="M12 15l2 2 4-4" />
    </svg>
  );
}

export function PressFormatIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#9333EA" />
      <path d="M12 4L14.2 9.8L20 12L14.2 14.2L12 20L9.8 14.2L4 12L9.8 9.8L12 4Z" fill="#FFFFFF" />
    </svg>
  );
}

export function MatrixFormatIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </svg>
  );
}

// 1. daily.dev Official Brand Logo
export function DailyDevBrandIcon({ size = 16, className, color = "currentColor" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="5" fill="#E11D48" />
      <path
        d="M6.5 6.5H12C15.0376 6.5 17.5 8.96243 17.5 12C17.5 15.0376 15.0376 17.5 12 17.5H6.5V6.5Z"
        fill="#FFFFFF"
      />
      <circle cx="12" cy="12" r="2.5" fill="#E11D48" />
    </svg>
  );
}

// 2. Medium Official Monogram Brand Logo
export function MediumBrandIcon({ size = 16, className, color = "currentColor" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="7" cy="12" r="5" fill="#15803D" />
      <ellipse cx="15.5" cy="12" rx="2.8" ry="4.8" fill="#15803D" />
      <ellipse cx="20.5" cy="12" rx="1.2" ry="4.4" fill="#15803D" />
    </svg>
  );
}

// 3. Dev.to Official Brand Logo
export function DevToBrandIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="4" fill="#0A0A0A" />
      <path
        d="M6.8 8.2H9.2C10.6 8.2 11.5 9.1 11.5 10.5V13.5C11.5 14.9 10.6 15.8 9.2 15.8H6.8V8.2ZM8.4 14.3H9.1C9.7 14.3 10 13.9 10 13.3V10.7C10 10.1 9.7 9.7 9.1 9.7H8.4V14.3ZM12.5 8.2H16V9.7H14.1V11.2H15.6V12.7H14.1V14.3H16V15.8H12.5V8.2ZM16.8 8.2H18.4L19.4 13.2L20.4 8.2H22L20.2 15.8H18.6L16.8 8.2Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// 4. Hashnode Official Brand Logo
export function HashnodeBrandIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="6" fill="#2563EB" />
      <circle cx="12" cy="12" r="4.5" fill="#FFFFFF" />
    </svg>
  );
}

// 5. Substack Official Brand Logo
export function SubstackBrandIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 4.5H20V7.2H4V4.5Z" fill="#D97706" />
      <path d="M4 9.5H20V12.2H4V9.5Z" fill="#D97706" />
      <path d="M4 14.5L12 19.5L20 14.5V20.5L12 23L4 20.5V14.5Z" fill="#D97706" />
    </svg>
  );
}

// 6. Indie Hackers Official Brand Logo
export function IndieHackersBrandIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="4" fill="#0E7490" />
      <path d="M7 6H10V18H7V6Z" fill="#FFFFFF" />
      <path d="M14 6H17V11H14V6ZM14 13H17V18H14V13Z" fill="#FFFFFF" />
    </svg>
  );
}

// 7. Ghost Official Brand Logo
export function GhostBrandIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="5" fill="#7E22CE" />
      <path
        d="M7 10C7 7.23858 9.23858 5 12 5C14.7614 5 17 7.23858 17 10V18L14.5 16.5L12 18L9.5 16.5L7 18V10Z"
        fill="#FFFFFF"
      />
      <circle cx="10" cy="9.5" r="1.2" fill="#7E22CE" />
      <circle cx="14" cy="9.5" r="1.2" fill="#7E22CE" />
    </svg>
  );
}

// 8. Radar / All Feeds Omni Icon
export function RadarBrandIcon({ size = 16, className, color = "currentColor" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 1 10 10" />
      <path d="M12 6a6 6 0 0 1 6 6" />
      <circle cx="12" cy="12" r="2" />
      <line x1="12" y1="12" x2="18" y2="6" />
    </svg>
  );
}

// 9. Matrix Analysis Grid Icon
export function MatrixBrandIcon({ size = 16, className, color = "currentColor" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </svg>
  );
}

// ---------------- Technology SVGs ----------------

// React Atom Icon
export function ReactIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#00D8FF" strokeWidth="1.5" />
      <ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="4"
        stroke="#00D8FF"
        strokeWidth="1.5"
        transform="rotate(60 12 12)"
      />
      <ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="4"
        stroke="#00D8FF"
        strokeWidth="1.5"
        transform="rotate(120 12 12)"
      />
      <circle cx="12" cy="12" r="1.8" fill="#00D8FF" />
    </svg>
  );
}

// Next.js Monogram Icon
export function NextjsIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="11" fill="#000000" />
      <path
        d="M14.9 16.5L8.2 8H6.5V16H8V9.7L14.2 17.5C14.4 17.2 14.7 16.9 14.9 16.5Z"
        fill="#FFFFFF"
      />
      <rect x="15.5" y="8" width="1.5" height="8" fill="#FFFFFF" />
    </svg>
  );
}

// TypeScript Icon
export function TypeScriptIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="4" fill="#3178C6" />
      <path
        d="M5 9.5H11.5M8.25 9.5V17M13 14.8C13.5 16.2 14.8 17 16.5 17C18.2 17 19.3 16 19.3 14.5C19.3 11.8 13.5 12.8 13.5 9.5C13.5 8 14.8 7 16.5 7C18 7 19.1 7.8 19.5 9"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Rust Gear Icon
export function RustIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="#E55B24" strokeWidth="2" />
      <path
        d="M10 8H13.5C14.8 8 15.5 8.7 15.5 10C15.5 11.3 14.8 12 13.5 12H11.8M11.8 12V16M11.8 12L15.5 16"
        stroke="#E55B24"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// PostgreSQL Icon
export function PostgresIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="4" fill="#336791" />
      <path
        d="M12 4C8 4 6 7 6 11C6 15 8 18 11 19V15C10 15 9 14 9 12C9 9 11 7 12 7C13 7 15 9 15 12C15 14 14 15 13 15V19C16 18 18 15 18 11C18 7 16 4 12 4Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// AWS Cloud Icon
export function AwsIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="4" fill="#232F3E" />
      <path
        d="M5 14.5C9 17 15 17 19 14.5M16.5 14L19 14.5L18.5 12"
        stroke="#FF9900"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Docker Whale Icon
export function DockerIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="4" fill="#2496ED" />
      <rect x="7" y="10" width="2" height="2" fill="#FFFFFF" />
      <rect x="10" y="10" width="2" height="2" fill="#FFFFFF" />
      <rect x="13" y="10" width="2" height="2" fill="#FFFFFF" />
      <rect x="10" y="7" width="2" height="2" fill="#FFFFFF" />
      <path
        d="M5 13C6 13 7 15 10 15C14 15 17 12 19 14C17 16 14 17 10 17C6 17 5 15 5 13Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// Kubernetes Wheel Icon
export function KubernetesIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="4" fill="#326CE5" />
      <circle cx="12" cy="12" r="5" stroke="#FFFFFF" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2" fill="#FFFFFF" />
      <line x1="12" y1="4" x2="12" y2="7" stroke="#FFFFFF" strokeWidth="1.5" />
      <line x1="12" y1="17" x2="12" y2="20" stroke="#FFFFFF" strokeWidth="1.5" />
      <line x1="4" y1="12" x2="7" y2="12" stroke="#FFFFFF" strokeWidth="1.5" />
      <line x1="17" y1="12" x2="20" y2="12" stroke="#FFFFFF" strokeWidth="1.5" />
    </svg>
  );
}

// Python Icon
export function PythonIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M11.8 4C8.5 4 8.7 5.5 8.7 5.5V7H12.2V7.5H6.2C4.7 7.5 4 8.5 4 10.5C4 12.5 5 13 6 13H7V11.5C7 10.1 8.1 9 9.5 9H13C14.1 9 15 8.1 15 7V5.5C15 4 13.5 4 11.8 4Z"
        fill="#3776AB"
      />
      <circle cx="10" cy="5.5" r="0.8" fill="#FFFFFF" />
      <path
        d="M12.2 20C15.5 20 15.3 18.5 15.3 18.5V17H11.8V16.5H17.8C19.3 16.5 20 15.5 20 13.5C20 11.5 19 11 18 11H17V12.5C17 13.9 15.9 15 14.5 15H11C9.9 15 9 15.9 9 17V18.5C9 20 10.5 20 12.2 20Z"
        fill="#FFD43B"
      />
      <circle cx="14" cy="18.5" r="0.8" fill="#3776AB" />
    </svg>
  );
}

// Anthropic MCP / AI Agent Sparkle Icon
export function AnthropicMcpIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="4" fill="#CC785C" />
      <path
        d="M12 4L14.2 9.8L20 12L14.2 14.2L12 20L9.8 14.2L4 12L9.8 9.8L12 4Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// eBPF / Security Shield Icon
export function EbpfShieldIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="4" fill="#059669" />
      <path
        d="M12 5L18 8V12C18 16 15 18.5 12 20C9 18.5 6 16 6 12V8L12 5Z"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 12L12 14L15 10" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// Sovereign AI & Semiconductor Chip Icon
export function SemiconductorIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="4" fill="#059669" />
      <rect x="7" y="7" width="10" height="10" rx="2" stroke="#FFFFFF" strokeWidth="1.5" />
      <path d="M10 10H14V14H10Z" fill="#FFFFFF" />
      <path d="M4 9H7M4 15H7M17 9H20M17 15H20M9 4V7M15 4V7M9 17V20M15 17V20" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// Voice AI / Streaming Audio Waveform Icon
export function VoiceAiIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="4" fill="#8B5CF6" />
      <path d="M5 12H7M8 9V15M10 6V18M12 4V20M14 7V17M16 10V14M18 11V13M19 12H20" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// Enterprise ROI / Strategy Analytics Icon
export function EnterpriseRoiIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="4" fill="#0284C7" />
      <path d="M6 18V14M10 18V10M14 18V12M18 18V7M5 8L10 13L14 9L19 5" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Reasoning AI / Neural Circuit Icon
export function ReasoningAiIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="4" fill="#DC2626" />
      <circle cx="12" cy="12" r="3" stroke="#FFFFFF" strokeWidth="1.5" />
      <circle cx="6" cy="8" r="1.5" fill="#FFFFFF" />
      <circle cx="18" cy="8" r="1.5" fill="#FFFFFF" />
      <circle cx="6" cy="16" r="1.5" fill="#FFFFFF" />
      <circle cx="18" cy="16" r="1.5" fill="#FFFFFF" />
      <path d="M7.5 8.5L9.5 10.5M16.5 8.5L14.5 10.5M7.5 15.5L9.5 13.5M16.5 15.5L14.5 13.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// Hyperscale Cloud Datacenter Icon
export function HyperscaleCloudIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="4" fill="#EA580C" />
      <rect x="5" y="6" width="14" height="4" rx="1" stroke="#FFFFFF" strokeWidth="1.4" />
      <rect x="5" y="14" width="14" height="4" rx="1" stroke="#FFFFFF" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="1" fill="#FFFFFF" />
      <circle cx="8" cy="16" r="1" fill="#FFFFFF" />
      <line x1="14" y1="8" x2="16" y2="8" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="14" y1="16" x2="16" y2="16" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// WebAssembly / Wasmtime Icon
export function WasmIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="4" fill="#654FF0" />
      <path d="M5 8L8 16L10 11L12 16L15 8" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 13L17 8L19 16" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Distributed Streaming / Apache Kafka Icon
export function KafkaIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="4" fill="#000000" />
      <circle cx="12" cy="12" r="3" fill="#FFFFFF" />
      <circle cx="6" cy="7" r="2" fill="#FFFFFF" />
      <circle cx="6" cy="17" r="2" fill="#FFFFFF" />
      <circle cx="18" cy="7" r="2" fill="#FFFFFF" />
      <circle cx="18" cy="17" r="2" fill="#FFFFFF" />
      <line x1="7.5" y1="8" x2="10.5" y2="10.5" stroke="#FFFFFF" strokeWidth="1.2" />
      <line x1="7.5" y1="16" x2="10.5" y2="13.5" stroke="#FFFFFF" strokeWidth="1.2" />
      <line x1="16.5" y1="8" x2="13.5" y2="10.5" stroke="#FFFFFF" strokeWidth="1.2" />
      <line x1="16.5" y1="16" x2="13.5" y2="13.5" stroke="#FFFFFF" strokeWidth="1.2" />
    </svg>
  );
}

// Platform Engineering & Crossplane Icon
export function CrossplaneIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="4" fill="#1A56DB" />
      <path d="M6 6H11V11H6V6Z" fill="#FFFFFF" />
      <path d="M13 6H18V11H13V6Z" fill="#93C5FD" />
      <path d="M6 13H11V18H6V13Z" fill="#93C5FD" />
      <path d="M13 13H18V18H13V13Z" fill="#FFFFFF" />
    </svg>
  );
}

// Quantum-Safe Cryptography Icon
export function QuantumSafeIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="4" fill="#0D9488" />
      <circle cx="12" cy="12" r="5" stroke="#FFFFFF" strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="8" ry="3" stroke="#FFFFFF" strokeWidth="1.2" transform="rotate(-30 12 12)" />
      <circle cx="12" cy="12" r="2" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Dynamic Technology Icon Resolver
 */
export function getTechnologyBrandIcon(tech: string, size = 16) {
  const norm = tech.toLowerCase();
  if (norm.includes("voice") || norm.includes("audio") || norm.includes("elevenlabs")) return <VoiceAiIcon size={size} />;
  if (norm.includes("sovereign") || norm.includes("semiconductor") || norm.includes("fab") || norm.includes("bharat")) return <SemiconductorIcon size={size} />;
  if (norm.includes("reasoning") || norm.includes("frontier") || norm.includes("deepseek") || norm.includes("the information")) return <ReasoningAiIcon size={size} />;
  if (norm.includes("bain") || norm.includes("roi") || norm.includes("economics") || norm.includes("enterprise")) return <EnterpriseRoiIcon size={size} />;
  if (norm.includes("datacenter") || norm.includes("hyperscale") || norm.includes("liquid cooling")) return <HyperscaleCloudIcon size={size} />;
  if (norm.includes("wasm") || norm.includes("webassembly")) return <WasmIcon size={size} />;
  if (norm.includes("kafka") || norm.includes("warpstream") || norm.includes("streaming")) return <KafkaIcon size={size} />;
  if (norm.includes("crossplane") || norm.includes("platform") || norm.includes("backstage")) return <CrossplaneIcon size={size} />;
  if (norm.includes("quantum") || norm.includes("cryptography") || norm.includes("pqc")) return <QuantumSafeIcon size={size} />;
  if (norm.includes("react")) return <ReactIcon size={size} />;
  if (norm.includes("next")) return <NextjsIcon size={size} />;
  if (norm.includes("typescript") || norm.includes("ts")) return <TypeScriptIcon size={size} />;
  if (norm.includes("rust") || norm.includes("tokio") || norm.includes("saas")) return <RustIcon size={size} />;
  if (norm.includes("postgres") || norm.includes("sql") || norm.includes("vector")) return <PostgresIcon size={size} />;
  if (norm.includes("aws") || norm.includes("cloud") || norm.includes("bedrock")) return <AwsIcon size={size} />;
  if (norm.includes("docker")) return <DockerIcon size={size} />;
  if (norm.includes("kubernetes") || norm.includes("k8s") || norm.includes("idp")) return <KubernetesIcon size={size} />;
  if (norm.includes("python")) return <PythonIcon size={size} />;
  if (norm.includes("mcp") || norm.includes("agent") || norm.includes("anthropic")) return <AnthropicMcpIcon size={size} />;
  if (norm.includes("ebpf") || norm.includes("security") || norm.includes("cilium")) return <EbpfShieldIcon size={size} />;
  return <RadarBrandIcon size={size} />;
}

