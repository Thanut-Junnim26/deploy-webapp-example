import React from 'react';
import { ChevronDown } from 'lucide-react';
import { monthKey } from '../utils/months';

const FilterBar = ({ startMonth, setStartMonth, endMonth, setEndMonth, months }) => {
    const handleStartChange = (val) => {
        setStartMonth(val);
        // If end is before start, reset end
        if (val !== 'All' && endMonth !== 'All') {
            const si = monthKey(val);
            const ei = monthKey(endMonth);
            if (ei < si) setEndMonth('All');
        }
    };

    const handleEndChange = (val) => {
        setEndMonth(val);
        // If start is after end, reset start
        if (val !== 'All' && startMonth !== 'All') {
            const si = monthKey(startMonth);
            const ei = monthKey(val);
            if (si > ei) setStartMonth('All');
        }
    };

    const clearRange = () => { setStartMonth('All'); setEndMonth('All'); };

    const hasFilter = startMonth !== 'All' || endMonth !== 'All';

    // For "End" dropdown: only show months >= start
    const endMonths = startMonth === 'All'
        ? months
        : months.filter(m => monthKey(m) >= monthKey(startMonth));

    // For "Start" dropdown: only show months <= end
    const startMonths = endMonth === 'All'
        ? months
        : months.filter(m => monthKey(m) <= monthKey(endMonth));

    // Build label
    const rangeLabel = hasFilter
        ? `${startMonth !== 'All' ? startMonth : months[0] || '—'} → ${endMonth !== 'All' ? endMonth : months[months.length - 1] || '—'}`
        : null;

    return (
        <section className="filter-bar flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative flex-1 sm:flex-none">
                    <label className="text-[10px] font-bold text-slate-400 absolute top-1.5 left-3 uppercase tracking-wider">
                        From
                    </label>
                    <select
                        className="w-full sm:w-auto pt-5 pb-1.5 px-3 pr-8 border border-slate-200 rounded-lg appearance-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 outline-none text-sm bg-white transition-all sm:min-w-[130px]"
                        value={startMonth}
                        onChange={(e) => handleStartChange(e.target.value)}
                    >
                        <option value="All">Earliest</option>
                        {startMonths.map((m) => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-6 text-slate-400 pointer-events-none" size={14} />
                </div>

                <span className="text-slate-300 text-sm font-bold shrink-0">→</span>

                <div className="relative flex-1 sm:flex-none">
                    <label className="text-[10px] font-bold text-slate-400 absolute top-1.5 left-3 uppercase tracking-wider">
                        To
                    </label>
                    <select
                        className="w-full sm:w-auto pt-5 pb-1.5 px-3 pr-8 border border-slate-200 rounded-lg appearance-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 outline-none text-sm bg-white transition-all sm:min-w-[130px]"
                        value={endMonth}
                        onChange={(e) => handleEndChange(e.target.value)}
                    >
                        <option value="All">Latest</option>
                        {endMonths.map((m) => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-6 text-slate-400 pointer-events-none" size={14} />
                </div>
            </div>

            {hasFilter && (
                <div className="flex items-center gap-2 animate-in">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold border bg-pink-50 text-pink-700 border-pink-200">
                        <span className="opacity-60">Period:</span>
                        <span>{rangeLabel}</span>
                        <button
                            onClick={clearRange}
                            className="ml-0.5 p-0.5 rounded hover:bg-pink-100 transition-colors"
                        >
                            ✕
                        </button>
                    </span>
                </div>
            )}
        </section>
    );
};

export default FilterBar;
