'use client';

import React from 'react';
import {
  BellIcon,
  MagnifyingGlassIcon,
  BookmarkIcon,
  FolderIcon,
  StarIcon,
  LockClosedIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

// Custom die icon (pips) because Heroicons doesn't include a traditional die/pips icon.
const DieIcon = ({ width = 24, height = 24, ariaHidden = true }: { width?: number; height?: number; ariaHidden?: boolean }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden={ariaHidden}
  >
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
    {/* Four corner pips */}
    <circle cx="8" cy="8" r="1.25" fill="currentColor" />
    <circle cx="16" cy="8" r="1.25" fill="currentColor" />
    <circle cx="8" cy="16" r="1.25" fill="currentColor" />
    <circle cx="16" cy="16" r="1.25" fill="currentColor" />
    {/* Center pip */}
    <circle cx="12" cy="12" r="1.25" fill="currentColor" />
  </svg>
);

// Custom graph icon (three nodes arranged in a triangle with connecting edges)
const GraphIcon = ({ width = 24, height = 24, ariaHidden = true }: { width?: number; height?: number; ariaHidden?: boolean }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden={ariaHidden}
  >
    {/* edges (triangle) */}
    <path d="M6 16 L12 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 7 L18 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 16 L18 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

    {/* nodes */}
    <circle cx="6" cy="16" r="3" fill="currentColor" />
    <circle cx="12" cy="7" r="3" fill="currentColor" />
    <circle cx="18" cy="16" r="3" fill="currentColor" />
  </svg>
);

const heroMap: Record<string, React.ComponentType<{ width?: number; height?: number; ariaHidden?: boolean }>> = {
  search: MagnifyingGlassIcon,
  save: BookmarkIcon,
  book: Squares2X2Icon,
  folder: FolderIcon,
  star: StarIcon,
  lock: LockClosedIcon,
  refresh: ArrowPathIcon,
  warning: ExclamationTriangleIcon,
  graph: GraphIcon,
  dice: DieIcon,
  hourglass: ArrowPathIcon,
  clipboard: BookmarkIcon,
};

interface IconProps {
  name: string;
  className?: string;
  size?: number;
  ariaLabel?: string;
}

export default function Icon({ name, className = '', size = 24, ariaLabel }: IconProps) {
  const Comp = heroMap[name];

  if (!Comp) {
    return (
      <span
        className={`gp-icon ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={`gp-icon ${className}`}
      style={{ width: size, height: size, display: 'inline-flex' }}
      role={ariaLabel ? 'img' : 'presentation'}
      aria-label={ariaLabel}
    >
      <Comp width={size} height={size} ariaHidden={!ariaLabel} />
    </span>
  );
}

