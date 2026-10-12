import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ children, size = 16, ...props }: IconProps & { children: ReactNode }) {
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

export const RefreshIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M16.5 10a6.5 6.5 0 1 1-1.9-4.6" />
    <path d="M16.5 3.5v3.6h-3.6" />
  </Icon>
);

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="9" r="5.5" />
    <path d="m13.2 13.2 3.3 3.3" />
  </Icon>
);

export const PinIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Icon {...p}>
    <path d="M7.5 3h5l-.8 5 2.8 2.6v1.4H5.5v-1.4L8.3 8z" fill={filled ? 'currentColor' : 'none'} />
    <path d="M10 12v5" />
  </Icon>
);

export const BackIcon = (p: IconProps) => (
  <Icon size={18} {...p}>
    <path d="M12.5 4.5 7 10l5.5 5.5" />
  </Icon>
);

export const ExternalIcon = (p: IconProps) => (
  <Icon size={13} {...p}>
    <path d="M11 4h5v5" />
    <path d="M16 4 9 11" />
    <path d="M14 12v3.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5H8" />
  </Icon>
);

export const ChevronIcon = (p: IconProps) => (
  <Icon size={14} {...p}>
    <path d="m8 5 5 5-5 5" />
  </Icon>
);

export const PlusIcon = (p: IconProps) => (
  <Icon size={18} {...p}>
    <path d="M10 4.5v11M4.5 10h11" />
  </Icon>
);

export const MoreIcon = (p: IconProps) => (
  <svg viewBox="0 0 20 20" width={16} height={16} fill="currentColor" aria-hidden="true" {...p}>
    <circle cx="4.5" cy="10" r="1.6" />
    <circle cx="10" cy="10" r="1.6" />
    <circle cx="15.5" cy="10" r="1.6" />
  </svg>
);

export const ChartIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 15.5 8 11l3 3 5.5-6" />
  </Icon>
);

export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 6h11M8 6V4.5h4V6M6 6l.7 9.5h6.6L14 6" />
  </Icon>
);

export const TopIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 4.5h10M10 16V8M6.5 11.5 10 8l3.5 3.5" />
  </Icon>
);

export const AlertIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10 3.5 17 16H3z" />
    <path d="M10 8.5v3.5M10 14.2v.1" />
  </Icon>
);

export const OfflineIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 7.5a10 10 0 0 1 14 0M5.5 10.5a6.5 6.5 0 0 1 9 0M8.2 13.4a2.6 2.6 0 0 1 3.6 0" />
    <path d="M3.5 3.5l13 13" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon size={14} {...p}>
    <path d="m4.5 10.5 3.5 3.5 7.5-8" />
  </Icon>
);

export const MarketIcon = (p: IconProps) => (
  <Icon size={18} {...p}>
    <path d="M3 14.5 7.5 10l3 3L17 6.5" />
    <path d="M13 6.5h4v4" />
  </Icon>
);

export const NewsIcon = (p: IconProps) => (
  <Icon size={18} {...p}>
    <rect x="3.5" y="4" width="13" height="12" rx="2" />
    <path d="M6.5 7.5h7M6.5 10.5h7M6.5 13.5h4" />
  </Icon>
);

export const SettingsIcon = (p: IconProps) => (
  <Icon size={18} {...p}>
    <path d="M4 6h7M15 6h1M4 14h1M9 14h7" />
    <circle cx="13" cy="6" r="2" />
    <circle cx="7" cy="14" r="2" />
  </Icon>
);
