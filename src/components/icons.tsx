import type { SVGProps } from 'react';

function Icon({ children, size = 18, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const MarketIcon = () => (
  <Icon>
    <path d="M3 14.5 7.5 10l3 3L17 6.5" />
    <path d="M13 6.5h4v4" />
  </Icon>
);

export const NewsIcon = () => (
  <Icon>
    <rect x="3.5" y="4" width="13" height="12" rx="2" />
    <path d="M6.5 7.5h7M6.5 10.5h7M6.5 13.5h4" />
  </Icon>
);

export const SettingsIcon = () => (
  <Icon>
    <path d="M4 6h7M15 6h1M4 14h1M9 14h7" />
    <circle cx="13" cy="6" r="2" />
    <circle cx="7" cy="14" r="2" />
  </Icon>
);
