import React from "react";

/**
 * Reusable skeleton block with pulse animation
 */
export const SkeletonBlock = ({ className = "", style = {} }) => (
  <div
    className={`animate-pulse bg-white/20 rounded ${className}`}
    style={style}
  />
);

/**
 * Skeleton for the main app loading (stats cards + header layout)
 */
export const AppLoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#121212] via-[#1E1E1E] to-[#121212]">
    <div className="w-full px-2 md:px-4 py-4 md:py-8">
      {/* Header skeleton */}
      <div className="text-center mb-8">
        <SkeletonBlock className="h-12 w-64 mx-auto mb-4" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-6 mb-6 md:mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-6 border border-white/20"
          >
            <SkeletonBlock className="h-8 w-16 mb-2" />
            <SkeletonBlock className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Analytics cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-6 border border-white/20"
          >
            <SkeletonBlock className="h-4 w-24 mb-2" />
            <SkeletonBlock className="h-8 w-20 mb-1" />
            <SkeletonBlock className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Tab area skeleton */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonBlock key={i} className="h-10 w-24 flex-shrink-0" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonBlock key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

/**
 * Skeleton for tab content (e.g. Daily Games, Prediction Accuracy)
 */
export const TabContentSkeleton = ({ lines = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="bg-white/5 rounded-lg p-4">
        <div className="flex justify-between mb-3">
          <SkeletonBlock className="h-5 w-48" />
          <SkeletonBlock className="h-4 w-20" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SkeletonBlock className="h-16 w-full" />
          <SkeletonBlock className="h-16 w-full" />
        </div>
      </div>
    ))}
  </div>
);

export default AppLoadingSkeleton;
