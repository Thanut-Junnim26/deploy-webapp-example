import React from 'react';

const Pulse = ({ className = '' }) => (
    <div className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded ${className}`}
        style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
    />
);

const SkeletonStatCard = () => (
    <div className="stat-card">
        <div className="flex justify-between items-start mb-3">
            <Pulse className="w-10 h-10 rounded-lg" />
            <Pulse className="w-20 h-3" />
        </div>
        <Pulse className="w-32 h-7 mb-2" />
        <Pulse className="w-24 h-3 mb-3" />
        <div className="flex gap-2">
            <Pulse className="w-16 h-5 rounded-full" />
            <Pulse className="w-16 h-5 rounded-full" />
        </div>
    </div>
);

const SkeletonChart = ({ height = 'h-[280px]' }) => (
    <div className="stat-card p-5">
        <div className="flex items-center gap-3 mb-4">
            <Pulse className="w-9 h-9 rounded-lg" />
            <Pulse className="w-40 h-5" />
        </div>
        <div className={`${height} flex items-end gap-2 px-4 pb-4`}>
            {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 65].map((h, i) => (
                <Pulse key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
            ))}
        </div>
    </div>
);

const SkeletonTable = () => (
    <div className="stat-card p-5">
        <div className="flex items-center gap-3 mb-4">
            <Pulse className="w-9 h-9 rounded-lg" />
            <Pulse className="w-32 h-5" />
            <div className="ml-auto">
                <Pulse className="w-16 h-4" />
            </div>
        </div>
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3">
                    <Pulse className="w-6 h-6 rounded-full" />
                    <Pulse className="flex-1 h-4" />
                    <Pulse className="w-20 h-4" />
                    <Pulse className="w-12 h-4" />
                </div>
            ))}
        </div>
    </div>
);

const SkeletonFilterBar = () => (
    <div className="filter-bar flex flex-wrap items-center gap-3">
        <Pulse className="w-[150px] h-[42px] rounded-lg" />
        <Pulse className="w-[180px] h-[42px] rounded-lg" />
        <div className="ml-auto">
            <Pulse className="w-24 h-6 rounded" />
        </div>
    </div>
);

const DashboardSkeleton = () => (
    <div className="min-h-screen bg-slate-50 font-sans">
        {/* Skeleton Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
            <div className="max-w-[1440px] mx-auto px-3 sm:px-4 md:px-8">
                <div className="flex items-center justify-between h-12 sm:h-14 gap-2">
                    <div className="flex items-center gap-3">
                        <Pulse className="w-9 h-9 rounded-lg" />
                        <Pulse className="w-40 h-5" />
                    </div>
                    <div className="flex gap-2">
                        <Pulse className="w-16 sm:w-20 h-8 rounded-full" />
                        <Pulse className="w-16 sm:w-20 h-8 rounded-full" />
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                        <Pulse className="w-8 sm:w-20 h-8 rounded-lg" />
                        <Pulse className="hidden sm:block w-32 h-8 rounded-lg" />
                    </div>
                </div>
            </div>
        </header>

        <main className="max-w-[1440px] mx-auto px-3 sm:px-4 md:px-8 py-3 sm:py-5">
            {/* Date Filter Skeleton */}
            <div className="mb-5 filter-bar flex items-center gap-3">
                <Pulse className="w-[150px] h-[42px] rounded-lg" />
                <Pulse className="w-6 h-4" />
                <Pulse className="w-[150px] h-[42px] rounded-lg" />
            </div>

            {/* View Filters Skeleton */}
            <div className="mb-5">
                <SkeletonFilterBar />
            </div>

            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-5">
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
            </div>

            {/* Chart Skeleton */}
            <div className="mb-5">
                <SkeletonChart />
            </div>

            {/* Tables Skeleton */}
            <div className="grid grid-cols-1 gap-5">
                <SkeletonTable />
                <SkeletonTable />
            </div>
        </main>

        {/* Shimmer keyframe */}
        <style>{`
            @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `}</style>
    </div>
);

export default DashboardSkeleton;
