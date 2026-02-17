import React, { memo } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton = memo(({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'wave'
}: SkeletonProps) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700/50';

  const variantClasses = {
    text: 'rounded-md h-4',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-xl',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'skeleton',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
});

Skeleton.displayName = 'Skeleton';

// Property Card Skeleton
const PropertyCardSkeleton = memo(() => (
  <div className="ios-card overflow-hidden">
    {/* Image skeleton */}
    <Skeleton className="w-full h-56 sm:h-48 md:h-52" variant="rectangular" />

    {/* Content skeleton */}
    <div className="p-4 space-y-3">
      {/* Price */}
      <Skeleton className="w-32 h-7" variant="rounded" />

      {/* Type badge */}
      <Skeleton className="w-20 h-5" variant="rounded" />

      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="w-full h-4" variant="text" />
        <Skeleton className="w-3/4 h-4" variant="text" />
      </div>

      {/* Location */}
      <div className="flex items-center gap-2">
        <Skeleton className="w-4 h-4" variant="circular" />
        <Skeleton className="w-40 h-3" variant="text" />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-700/30">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4" variant="circular" />
          <Skeleton className="w-12 h-3" variant="text" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4" variant="circular" />
          <Skeleton className="w-12 h-3" variant="text" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4" variant="circular" />
          <Skeleton className="w-16 h-3" variant="text" />
        </div>
      </div>

      {/* Features */}
      <div className="flex gap-2">
        <Skeleton className="w-16 h-6" variant="rounded" />
        <Skeleton className="w-20 h-6" variant="rounded" />
        <Skeleton className="w-14 h-6" variant="rounded" />
      </div>
    </div>
  </div>
));

PropertyCardSkeleton.displayName = 'PropertyCardSkeleton';

// Listings Grid Skeleton
const ListingsGridSkeleton = memo(({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className="animate-ios-spring-in"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <PropertyCardSkeleton />
      </div>
    ))}
  </div>
));

ListingsGridSkeleton.displayName = 'ListingsGridSkeleton';

// Hero Skeleton
const HeroSkeleton = memo(() => (
  <div className="relative min-h-[100dvh] w-full flex flex-col bg-gray-900">
    {/* Background shimmer */}
    <div className="absolute inset-0 skeleton" />

    {/* Content skeleton */}
    <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-4xl mx-auto text-center space-y-6">
        {/* Tagline */}
        <Skeleton className="w-48 h-4 mx-auto" variant="rounded" />

        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="w-80 h-12 mx-auto" variant="rounded" />
          <Skeleton className="w-64 h-12 mx-auto" variant="rounded" />
        </div>

        {/* Subtitle */}
        <Skeleton className="w-96 h-5 mx-auto" variant="rounded" />

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Skeleton className="w-40 h-12" variant="rounded" />
          <Skeleton className="w-40 h-12" variant="rounded" />
        </div>
      </div>
    </div>

    {/* Stats skeleton */}
    <div className="relative z-10 border-t border-white/10 bg-black/20 py-6">
      <div className="max-w-4xl mx-auto px-4 flex justify-center gap-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <Skeleton className="w-16 h-8 mx-auto mb-2" variant="rounded" />
            <Skeleton className="w-12 h-3 mx-auto" variant="text" />
          </div>
        ))}
      </div>
    </div>
  </div>
));

HeroSkeleton.displayName = 'HeroSkeleton';

// Search Bar Skeleton
const SearchBarSkeleton = memo(() => (
  <div className="w-full max-w-2xl">
    <Skeleton className="w-full h-14 sm:h-16" variant="rounded" />
  </div>
));

SearchBarSkeleton.displayName = 'SearchBarSkeleton';

// Filter Button Skeleton
const FilterButtonsSkeleton = memo(({ count = 5 }: { count?: number }) => (
  <div className="flex gap-2 sm:gap-3 overflow-hidden pb-6 sm:pb-8">
    {Array.from({ length: count }).map((_, index) => (
      <Skeleton
        key={index}
        className="w-24 h-11 flex-shrink-0"
        variant="rounded"
      />
    ))}
  </div>
));

FilterButtonsSkeleton.displayName = 'FilterButtonsSkeleton';

// Text Block Skeleton
const TextBlockSkeleton = memo(({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        className={`h-4 ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
        variant="text"
      />
    ))}
  </div>
));

TextBlockSkeleton.displayName = 'TextBlockSkeleton';

// Avatar Skeleton
const AvatarSkeleton = memo(({ size = 40 }: { size?: number }) => (
  <Skeleton
    className="flex-shrink-0"
    variant="circular"
    width={size}
    height={size}
  />
));

AvatarSkeleton.displayName = 'AvatarSkeleton';

// Comment/Review Skeleton
const CommentSkeleton = memo(() => (
  <div className="flex gap-3 p-4">
    <AvatarSkeleton size={40} />
    <div className="flex-1 space-y-2">
      <Skeleton className="w-32 h-4" variant="text" />
      <Skeleton className="w-full h-3" variant="text" />
      <Skeleton className="w-5/6 h-3" variant="text" />
    </div>
  </div>
));

CommentSkeleton.displayName = 'CommentSkeleton';

export {
  Skeleton,
  PropertyCardSkeleton,
  ListingsGridSkeleton,
  HeroSkeleton,
  SearchBarSkeleton,
  FilterButtonsSkeleton,
  TextBlockSkeleton,
  AvatarSkeleton,
  CommentSkeleton,
};

export default Skeleton;
