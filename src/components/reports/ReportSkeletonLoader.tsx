'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

export default function ReportSkeletonLoader() {
  return (
    <div className="space-y-4" role="status" aria-label="Memuat laporan...">
      <span className="sr-only">Memuat laporan...</span>

      {/* Summary card skeleton — 3 columns */}
      <Card>
        <SkeletonLoader width="40%" height="0.75rem" className="mb-3" />
        <div className="grid grid-cols-3 gap-2 text-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <SkeletonLoader width="60%" height="0.625rem" />
              <SkeletonLoader width="80%" height="1rem" />
            </div>
          ))}
        </div>
      </Card>

      {/* Pie chart + category breakdown area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <SkeletonLoader width="50%" height="0.75rem" className="mb-3" />
          <div className="flex justify-center">
            <SkeletonLoader shape="circle" width="10rem" height="10rem" />
          </div>
        </Card>
        <Card>
          <SkeletonLoader width="50%" height="0.75rem" className="mb-3" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <SkeletonLoader shape="circle" width="1.5rem" height="1.5rem" />
                <div className="flex-1 space-y-1">
                  <SkeletonLoader width="60%" height="0.625rem" />
                  <SkeletonLoader width="100%" height="0.5rem" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Trend chart area */}
      <Card>
        <SkeletonLoader width="60%" height="0.75rem" className="mb-3" />
        <SkeletonLoader width="100%" height="12rem" />
      </Card>

      {/* Month-over-month comparison area */}
      <Card>
        <SkeletonLoader width="55%" height="0.75rem" className="mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <SkeletonLoader width="50%" height="0.625rem" />
              <SkeletonLoader width="70%" height="1rem" />
              <SkeletonLoader width="40%" height="0.625rem" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
