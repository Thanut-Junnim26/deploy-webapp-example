import React, { useMemo, useRef, useEffect, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

const FilterSelect = ({ label, value, onChange, options }) => (
    <div className="relative">
        <label className="text-[10px] font-bold text-slate-400 absolute top-2 left-3 uppercase tracking-wider">{label}</label>
        <select
            className="w-full pt-6 pb-2 px-3 border border-slate-200/80 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none text-sm bg-white/60 backdrop-blur-sm transition-all"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        <ChevronDown className="absolute right-3 top-7 text-slate-400 pointer-events-none" size={16} />
    </div>
);

const FilterBar = ({
    selectedMonth, setSelectedMonth,
    selectedShopType, setSelectedShopType,
    selectedShopSegment, setSelectedShopSegment,
    selectedProductSub, setSelectedProductSub,
    selectedProductSegment, setSelectedProductSegment,
    searchTerm, setSearchTerm,
    distinctValues
}) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const suggestions = useMemo(() => {
        if (!searchTerm.trim()) return [];
        return distinctValues.shopNames
            .filter((name) => name.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 8);
    }, [searchTerm, distinctValues.shopNames]);

    return (
        <section className="filter-bar grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <FilterSelect
                label="Time Period"
                value={selectedMonth}
                onChange={setSelectedMonth}
                options={[{ value: 'All', label: 'All Months' }, ...distinctValues.months.map((m) => ({ value: m, label: m }))]}
            />
            <FilterSelect
                label="Shop Type"
                value={selectedShopType}
                onChange={setSelectedShopType}
                options={[{ value: 'All', label: 'All Types' }, ...distinctValues.shopTypes.map((t) => ({ value: t, label: t }))]}
            />
            <FilterSelect
                label="Shop Segment"
                value={selectedShopSegment}
                onChange={setSelectedShopSegment}
                options={[{ value: 'All', label: 'All Segments' }, ...distinctValues.shopSegments.map((s) => ({ value: s, label: s }))]}
            />
            <FilterSelect
                label="Product Category"
                value={selectedProductSub}
                onChange={setSelectedProductSub}
                options={[{ value: 'All', label: 'All Categories' }, ...distinctValues.productSubs.map((p) => ({ value: p, label: p }))]}
            />
            <FilterSelect
                label="Product Tier"
                value={selectedProductSegment}
                onChange={setSelectedProductSegment}
                options={[{ value: 'All', label: 'All Tiers' }, ...distinctValues.productSegments.map((p) => ({ value: p, label: p }))]}
            />

            {/* Search with Autocomplete */}
            <div className="relative" ref={searchRef}>
                <label className="text-[10px] font-bold text-slate-400 absolute top-2 left-3 uppercase tracking-wider z-10">Search Shop</label>
                <Search className="absolute left-3 top-8 text-slate-400" size={14} />
                <input
                    type="text"
                    placeholder="Type shop name..."
                    className="w-full pt-6 pb-2 pl-8 pr-3 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none text-sm bg-white/60 backdrop-blur-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => searchTerm.trim() && setShowSuggestions(true)}
                />
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                        {suggestions.map((name, idx) => (
                            <button
                                key={idx}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setSearchTerm(name);
                                    setShowSuggestions(false);
                                }}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default FilterBar;
