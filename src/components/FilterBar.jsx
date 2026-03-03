import React from 'react';
import { ChevronDown } from 'lucide-react';

const MONTH_ORDER = [
    'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25',
    'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25', 'Jan-26', 'Feb-26'
];

const FilterBar = ({ startMonth, setStartMonth, endMonth, setEndMonth, months }) => {
    const handleStartChange = (val) => {
        setStartMonth(val);
        // If end is before start, reset end
        if (val !== 'All' && endMonth !== 'All') {
            const si = MONTH_ORDER.indexOf(val);
            const ei = MONTH_ORDER.indexOf(endMonth);
            if (ei < si) setEndMonth('All');
        }
    };

    const handleEndChange = (val) => {
        setEndMonth(val);
        // If start is after end, reset start
        if (val !== 'All' && startMonth !== 'All') {
            const si = MONTH_ORDER.indexOf(startMonth);
            const ei = MONTH_ORDER.indexOf(val);
            if (si > ei) setStartMonth('All');
        }
    };

    const clearRange = () => { setStartMonth('All'); setEndMonth('All'); };

    const hasFilter = startMonth !== 'All' || endMonth !== 'All';

    // For "End" dropdown: only show months >= start
    const endMonths = startMonth === 'All'
        ? months
        : months.filter(m => MONTH_ORDER.indexOf(m) >= MONTH_ORDER.indexOf(startMonth));

    // For "Start" dropdown: only show months <= end
    const startMonths = endMonth === 'All'
        ? months
        : months.filter(m => MONTH_ORDER.indexOf(m) <= MONTH_ORDER.indexOf(endMonth));

    // Build label
    const rangeLabel = hasFilter
        ? `${startMonth !== 'All' ? startMonth : months[0] || '—'} → ${endMonth !== 'All' ? endMonth : months[months.length - 1] || '—'}`
        : null;

    return (
        <section className="filter-bar flex flex-wrap items-center gap-3">
            <div className="relative">
                <label className="text-[10px] font-bold text-slate-400 absolute top-1.5 left-3 uppercase tracking-wider">
                    From
                </label>
                <select
                    className="pt-5 pb-1.5 px-3 pr-8 border border-slate-200 rounded-lg appearance-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 outline-none text-sm bg-white transition-all min-w-[130px]"
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

            <span className="text-slate-300 text-sm font-bold">→</span>

            <div className="relative">
                <label className="text-[10px] font-bold text-slate-400 absolute top-1.5 left-3 uppercase tracking-wider">
                    To
                </label>
                <select
                    className="pt-5 pb-1.5 px-3 pr-8 border border-slate-200 rounded-lg appearance-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 outline-none text-sm bg-white transition-all min-w-[130px]"
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
