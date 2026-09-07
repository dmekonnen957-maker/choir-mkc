import React from 'react';

export function FeaturedPerformanceSkeleton() {
    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 sm:p-8 animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 h-64 sm:h-80 bg-slate-200 rounded-2xl"></div>
            <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-28 bg-blue-100 rounded-full"></div>
                    <div className="h-6 w-20 bg-emerald-100 rounded-full"></div>
                </div>
                <div className="h-8 w-4/5 bg-slate-200 rounded"></div>
                <div className="h-5 w-1/2 bg-slate-100 rounded"></div>
                <div className="h-4 w-5/6 bg-slate-100 rounded"></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
                    <div className="h-16 bg-slate-50 rounded-xl"></div>
                    <div className="h-16 bg-slate-50 rounded-xl"></div>
                    <div className="h-16 bg-slate-50 rounded-xl"></div>
                </div>
                <div className="h-11 w-40 bg-blue-200 rounded-xl mt-4"></div>
            </div>
        </div>
    );
}

export function PerformanceCardSkeleton() {
    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-pulse flex flex-col justify-between">
            <div className="h-48 bg-slate-200 w-full"></div>
            <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="h-5 w-24 bg-blue-100 rounded-full"></div>
                    <div className="h-5 w-16 bg-slate-100 rounded-full"></div>
                </div>
                <div className="h-6 w-3/4 bg-slate-200 rounded"></div>
                <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
                <div className="h-4 w-5/6 bg-slate-100 rounded"></div>
                <div className="flex items-center gap-3 pt-2">
                    <div className="h-5 w-24 bg-slate-100 rounded-lg"></div>
                    <div className="h-5 w-24 bg-slate-100 rounded-lg"></div>
                </div>
            </div>
            <div className="p-4 border-t border-slate-50 bg-slate-50/50">
                <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
            </div>
        </div>
    );
}

export function SongCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse flex flex-col justify-between">
            <div className="space-y-3">
                <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl"></div>
                    <div className="w-16 h-5 bg-slate-100 rounded-full"></div>
                </div>
                <div className="h-5 w-4/5 bg-slate-200 rounded pt-2"></div>
                <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
                <div className="h-4 w-2/3 bg-slate-100 rounded"></div>
            </div>
            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="h-4 w-20 bg-slate-100 rounded"></div>
                <div className="h-8 w-24 bg-blue-50 rounded-lg"></div>
            </div>
        </div>
    );
}

export function ChoirCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-pulse">
            <div className="h-48 bg-slate-200 w-full"></div>
            <div className="p-6 space-y-3">
                <div className="h-6 w-3/4 bg-slate-200 rounded"></div>
                <div className="h-4 w-full bg-slate-100 rounded"></div>
                <div className="h-4 w-2/3 bg-slate-100 rounded"></div>
                <div className="flex items-center gap-3 pt-3">
                    <div className="h-5 w-16 bg-blue-50 rounded-full"></div>
                    <div className="h-5 w-20 bg-slate-100 rounded-full"></div>
                </div>
            </div>
        </div>
    );
}

export function PageHeaderSkeleton({ titleWidth = "w-64", subtitleWidth = "w-96" }) {
    return (
        <div className="py-12 bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 text-white animate-pulse">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
                <div className={`h-10 ${titleWidth} bg-white/20 rounded-lg mb-4`}></div>
                <div className={`h-5 ${subtitleWidth} bg-white/10 rounded-md`}></div>
            </div>
        </div>
    );
}

export function PublicPageSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="py-16 bg-blue-900 text-white animate-pulse">
                <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center">
                    <div className="h-8 w-48 bg-white/20 rounded mb-3"></div>
                    <div className="h-4 w-80 bg-white/10 rounded"></div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PerformanceCardSkeleton />
                    <PerformanceCardSkeleton />
                    <PerformanceCardSkeleton />
                </div>
            </div>
        </div>
    );
}

export function AboutSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50 animate-pulse">
            <div className="py-20 bg-blue-900 text-white">
                <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center">
                    <div className="h-10 w-72 bg-white/20 rounded-xl mb-4"></div>
                    <div className="h-5 w-96 bg-white/10 rounded"></div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="h-64 bg-white rounded-2xl border border-slate-100 p-8"></div>
                    <div className="h-64 bg-white rounded-2xl border border-slate-100 p-8"></div>
                </div>
                <div className="h-80 bg-white rounded-2xl border border-slate-100 p-8"></div>
            </div>
        </div>
    );
}
