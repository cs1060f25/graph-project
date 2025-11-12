import React from 'react';
import './Icon.css';
import { BellIcon, MagnifyingGlassIcon, BookmarkIcon, FolderIcon, StarIcon, LockClosedIcon, ArrowPathIcon, ExclamationTriangleIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

const heroMap = {
  search: MagnifyingGlassIcon,
  save: BookmarkIcon,
  book: Squares2X2Icon,
  folder: FolderIcon,
  star: StarIcon,
  lock: LockClosedIcon,
  refresh: ArrowPathIcon,
  warning: ExclamationTriangleIcon,
  graph: Squares2X2Icon,
  dice: Squares2X2Icon,
  hourglass: ArrowPathIcon,
  clipboard: BookmarkIcon
};

export default function Icon({ name, className = '', size = 24, ariaLabel }) {
  const Comp = heroMap[name];

  if (!Comp) return <span className={`gp-icon ${className}`} style={{ width: size, height: size }} />;

  return (
    <span
      className={`gp-icon ${className}`}
      style={{ width: size, height: size, display: 'inline-flex' }}
      role={ariaLabel ? 'img' : 'presentation'}
      aria-label={ariaLabel}
    >
      <Comp width={size} height={size} aria-hidden={!ariaLabel} />
    </span>
  );
}
