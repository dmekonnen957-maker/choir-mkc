import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
    currentPage = 1,
    lastPage = 1,
    total = 0,
    perPage = 15,
    onPageChange,
    itemName = 'items',
    className = '',
}) {
    if (!lastPage || lastPage <= 1) {
        return null;
    }

    const startItem = Math.min((currentPage - 1) * perPage + 1, total);
    const endItem = Math.min(currentPage * perPage, total);

    // Generate page numbers with ellipsis
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (lastPage <= maxVisible + 2) {
            for (let i = 1; i <= lastPage; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            let start = Math.max(2, currentPage - 1);
            let end = Math.min(lastPage - 1, currentPage + 1);

            if (currentPage <= 3) {
                end = 4;
            } else if (currentPage >= lastPage - 2) {
                start = lastPage - 3;
            }

            if (start > 2) {
                pages.push('ellipsis-start');
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (end < lastPage - 1) {
                pages.push('ellipsis-end');
            }

            pages.push(lastPage);
        }

        return pages;
    };

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-4 ${className}`}>
            {total > 0 && (
                <div className="text-xs sm:text-sm text-slate-500 font-medium text-center sm:text-left">
                    Showing <span className="font-bold text-slate-800">{startItem}</span> to{' '}
                    <span className="font-bold text-slate-800">{endItem}</span> of{' '}
                    <span className="font-bold text-slate-800">{total}</span> {itemName}
                </div>
            )}

            <div className="flex items-center gap-1.5">
                {/* Previous Button */}
                <button
                    type="button"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:pointer-events-none"
                    aria-label="Previous page"
                >
                    <ChevronLeft size={16} />
                    <span className="hidden sm:inline">Previous</span>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                    {getPageNumbers().map((p, idx) => {
                        if (typeof p === 'string') {
                            return (
                                <span key={`${p}-${idx}`} className="px-2 text-slate-400 text-xs sm:text-sm select-none">
                                    …
                                </span>
                            );
                        }

                        const isActive = p === currentPage;

                        return (
                            <button
                                key={p}
                                type="button"
                                onClick={() => onPageChange(p)}
                                className={`min-w-[36px] h-9 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center px-2.5 ${
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
                                }`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {p}
                            </button>
                        );
                    })}
                </div>

                {/* Next Button */}
                <button
                    type="button"
                    onClick={() => onPageChange(Math.min(lastPage, currentPage + 1))}
                    disabled={currentPage >= lastPage}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:pointer-events-none"
                    aria-label="Next page"
                >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
