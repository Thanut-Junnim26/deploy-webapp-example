import React from 'react';
import { X } from 'lucide-react';

const FILTER_LABELS = {
    shopSegment: 'Shop Segment',
    productSub: 'Product Category',
    productSegment: 'Product Tier',
    shopName: 'Shop',
    productName: 'Product',
    isWeekend: 'Day Type',
};

const FILTER_COLORS = {
    shopSegment: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    productSub: 'bg-violet-50 text-violet-700 border-violet-200',
    productSegment: 'bg-amber-50 text-amber-700 border-amber-200',
    shopName: 'bg-blue-50 text-blue-700 border-blue-200',
    productName: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    isWeekend: 'bg-cyan-50 text-cyan-700 border-cyan-200',
};

const ActiveFilters = ({ chartFilter, onClear }) => {
    if (!chartFilter) return null;

    const label = FILTER_LABELS[chartFilter.type] || chartFilter.type;
    const colors = FILTER_COLORS[chartFilter.type] || 'bg-slate-50 text-slate-700 border-slate-200';

    return (
        <div className="flex items-center gap-2 animate-in">
            <span className="text-xs text-slate-400 font-medium">Chart filter:</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${colors} active-filter-pill`}>
                <span className="opacity-60">{label}:</span>
                <span>{chartFilter.value}</span>
                <button
                    onClick={onClear}
                    className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 transition-colors"
                >
                    <X size={12} />
                </button>
            </span>
        </div>
    );
};

export default ActiveFilters;
