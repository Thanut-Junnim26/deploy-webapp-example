import React, { useMemo, useState, useCallback } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, Cell, Legend
} from 'recharts';
import { TrendingUp, Package, ShoppingBag, Store, ChevronDown, Calendar, DollarSign } from 'lucide-react';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import DataBarTable from '../components/DataBarTable';

const COLORS = ['#dc2626', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#0ea5e9'];

const MONTH_ORDER = [
    'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25',
    'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25', 'Jan-26', 'Feb-26'
];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-slate-200 max-w-xs">
            <p className="font-bold text-slate-700 text-sm mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="text-xs" style={{ color: p.color }}>
                    {p.name}: <strong>฿{p.value?.toLocaleString()}</strong>
                </p>
            ))}
        </div>
    );
};

function calcMoM(byMonth, months) {
    if (months.length < 2) return 'single';
    const latest = months[months.length - 1];
    const prev = months[months.length - 2];
    const latestVal = byMonth[latest] || 0;
    const prevVal = byMonth[prev] || 0;
    if (prevVal === 0) return null;
    return ((latestVal - prevVal) / prevVal) * 100;
}

function calcYoY(byMonth, months) {
    if (months.length < 2) return 'single';
    const latest = months[months.length - 1];
    const [mon, yr] = latest.split('-');
    const prevYr = String(parseInt(yr, 10) - 1);
    const yoyMonth = `${mon}-${prevYr}`;
    const latestVal = byMonth[latest] || 0;
    const prevVal = byMonth[yoyMonth] || 0;
    if (prevVal === 0) return null;
    return ((latestVal - prevVal) / prevVal) * 100;
}

function getSortedMonths(data) {
    const months = [...new Set(data.map(t => t.month).filter(Boolean))];
    return months.sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));
}

function getTopItemsWithMoM(data, key, months, limit = 10) {
    const byItem = {};
    data.forEach(t => {
        const name = t[key];
        if (!byItem[name]) byItem[name] = { name, revenue: 0, units: 0, byMonth: {} };
        byItem[name].revenue += t.amount;
        byItem[name].units += t.qty;
        byItem[name].byMonth[t.month] = (byItem[name].byMonth[t.month] || 0) + t.amount;
    });
    return Object.values(byItem)
        .map(item => ({
            ...item,
            revenue: Math.round(item.revenue),
            mom: calcMoM(item.byMonth, months)
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);
}

// Day Filter Bar Component
const DayFilterBar = ({ availableDays, dayFrom, dayTo, onDayClick, onClear }) => {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <Calendar size={13} className="text-pink-500" />
                    Filter by Date
                </div>
                {(dayFrom !== null) && (
                    <button
                        onClick={onClear}
                        className="text-[11px] font-semibold text-pink-600 hover:text-pink-800 transition-colors px-2 py-0.5 rounded hover:bg-pink-50"
                    >
                        ✕ Clear
                    </button>
                )}
            </div>
            <div className="flex flex-wrap gap-1">
                {availableDays.map(day => {
                    const isSelected = dayFrom !== null && dayTo !== null && day >= dayFrom && day <= dayTo;
                    const isEndpoint = day === dayFrom || day === dayTo;
                    return (
                        <button
                            key={day}
                            onClick={() => onDayClick(day)}
                            className={`
                                w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer
                                ${isEndpoint
                                    ? 'bg-gradient-to-br from-pink-600 via-red-500 to-orange-500 text-white shadow-sm scale-105'
                                    : isSelected
                                        ? 'bg-red-50 text-red-700 border border-red-200'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'
                                }
                            `}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
            {dayFrom !== null && (
                <div className="text-[11px] text-slate-500">
                    {dayFrom === dayTo
                        ? <span>📅 Showing date <strong className="text-slate-700">{dayFrom}</strong></span>
                        : <span>📅 Showing dates <strong className="text-slate-700">{dayFrom}</strong> — <strong className="text-slate-700">{dayTo}</strong></span>
                    }
                </div>
            )}
        </div>
    );
};

const ProductView = ({ filteredData }) => {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedProduct, setSelectedProduct] = useState('All');
    const [dayFrom, setDayFrom] = useState(null);
    const [dayTo, setDayTo] = useState(null);

    const categories = useMemo(() => [...new Set(filteredData.map(t => t.productSub).filter(Boolean))].sort(), [filteredData]);
    const products = useMemo(() => {
        let data = filteredData;
        if (selectedCategory !== 'All') data = data.filter(t => t.productSub === selectedCategory);
        return [...new Set(data.map(t => t.productName).filter(Boolean))].sort();
    }, [filteredData, selectedCategory]);

    // Base data: filtered by category/product but NOT by day (for chart)
    const baseData = useMemo(() => {
        let data = filteredData;
        if (selectedCategory !== 'All') data = data.filter(t => t.productSub === selectedCategory);
        if (selectedProduct !== 'All') data = data.filter(t => t.productName === selectedProduct);
        return data;
    }, [filteredData, selectedCategory, selectedProduct]);

    // viewData: base data + day filter applied (for stats, tables, etc.)
    const viewData = useMemo(() => {
        if (dayFrom === null) return baseData;
        return baseData.filter(t => t.invoiceDay >= dayFrom && t.invoiceDay <= dayTo);
    }, [baseData, dayFrom, dayTo]);

    const handleCategoryChange = (val) => {
        setSelectedCategory(val);
        setSelectedProduct('All');
        setDayFrom(null);
        setDayTo(null);
    };

    const handleProductChange = (val) => {
        setSelectedProduct(val);
        setDayFrom(null);
        setDayTo(null);
    };

    const level = selectedProduct !== 'All' ? 3 : selectedCategory !== 'All' ? 2 : 1;
    const months = useMemo(() => getSortedMonths(baseData), [baseData]);
    const isSingleMonth = months.length === 1;

    // Available days for the day filter bar
    const availableDays = useMemo(() => {
        if (!isSingleMonth) return [];
        const days = new Set(baseData.map(t => t.invoiceDay).filter(Boolean));
        return [...days].sort((a, b) => a - b);
    }, [baseData, isSingleMonth]);

    // Day click handler: first click = set single day, second click = set range end
    const handleDayClick = useCallback((day) => {
        if (dayFrom === null) {
            setDayFrom(day);
            setDayTo(day);
        } else if (dayFrom === day && dayTo === day) {
            setDayFrom(null);
            setDayTo(null);
        } else if (dayFrom !== null && dayTo === dayFrom) {
            const from = Math.min(dayFrom, day);
            const to = Math.max(dayFrom, day);
            setDayFrom(from);
            setDayTo(to);
        } else {
            setDayFrom(day);
            setDayTo(day);
        }
    }, [dayFrom, dayTo]);

    const handleDayClear = useCallback(() => {
        setDayFrom(null);
        setDayTo(null);
    }, []);

    // Chart click handler
    const handleChartClick = useCallback((data) => {
        if (data && data.activePayload && data.activePayload.length > 0) {
            const clickedDay = parseInt(data.activeLabel, 10);
            if (!isNaN(clickedDay)) {
                handleDayClick(clickedDay);
            }
        }
    }, [handleDayClick]);

    // Reset day filter when month changes
    useMemo(() => {
        if (!isSingleMonth) {
            setDayFrom(null);
            setDayTo(null);
        }
    }, [isSingleMonth]);

    const stats = useMemo(() => {
        const totalRevenue = viewData.reduce((s, t) => s + t.amount, 0);
        const totalQty = viewData.reduce((s, t) => s + t.qty, 0);
        const totalTxns = viewData.length;
        const aov = totalTxns > 0 ? Math.round(totalRevenue / totalTxns) : 0;
        const byMonth = {};
        viewData.forEach(t => { byMonth[t.month] = (byMonth[t.month] || 0) + t.amount; });
        return { totalRevenue, totalQty, totalTxns, aov, mom: calcMoM(byMonth, months), yoy: calcYoY(byMonth, months) };
    }, [viewData, months]);

    // ---- Revenue Trend by Category (multi-line) — uses baseData for chart ----
    const { categoryTrendData, trendCategories } = useMemo(() => {
        if (isSingleMonth) {
            const catRevenue = {};
            baseData.forEach(t => { catRevenue[t.productSub] = (catRevenue[t.productSub] || 0) + t.amount; });
            const sortedCats = Object.entries(catRevenue)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name]) => name);

            const byDayCat = {};
            baseData.forEach(t => {
                const day = t.invoiceDay;
                if (!day) return;
                if (!byDayCat[day]) byDayCat[day] = { period: String(day) };
                if (sortedCats.includes(t.productSub)) {
                    byDayCat[day][t.productSub] = (byDayCat[day][t.productSub] || 0) + t.amount;
                }
            });

            const days = Object.keys(byDayCat).map(Number).sort((a, b) => a - b);
            const data = days.map(d => {
                const row = byDayCat[d];
                sortedCats.forEach(c => { if (row[c]) row[c] = Math.round(row[c]); });
                return row;
            });

            return { categoryTrendData: data, trendCategories: sortedCats };
        }

        const catRevenue = {};
        baseData.forEach(t => { catRevenue[t.productSub] = (catRevenue[t.productSub] || 0) + t.amount; });
        const sortedCats = Object.entries(catRevenue)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name]) => name);

        const byMonthCat = {};
        months.forEach(m => { byMonthCat[m] = { period: m }; });
        baseData.forEach(t => {
            if (sortedCats.includes(t.productSub)) {
                byMonthCat[t.month][t.productSub] = (byMonthCat[t.month][t.productSub] || 0) + t.amount;
            }
        });

        const data = months.map(m => {
            const row = byMonthCat[m];
            sortedCats.forEach(c => { if (row[c]) row[c] = Math.round(row[c]); });
            return row;
        });

        return { categoryTrendData: data, trendCategories: sortedCats };
    }, [baseData, months, isSingleMonth]);

    // ---- Simple trend (for level 2 & 3) — uses baseData for chart ----
    const simpleTrendData = useMemo(() => {
        let rawData;
        if (isSingleMonth) {
            const byDay = {};
            baseData.forEach(t => {
                const day = t.invoiceDay;
                if (!day) return;
                byDay[day] = (byDay[day] || 0) + t.amount;
            });
            const days = Object.keys(byDay).map(Number).sort((a, b) => a - b);
            rawData = days.map(d => ({ period: String(d), revenue: Math.round(byDay[d] || 0) }));
        } else {
            const byMonth = {};
            baseData.forEach(t => { byMonth[t.month] = (byMonth[t.month] || 0) + t.amount; });
            rawData = months.map(m => ({ period: m, revenue: Math.round(byMonth[m] || 0) }));
        }
        // Add 3-period moving average
        const windowSize = 3;
        return rawData.map((item, idx) => {
            if (idx < windowSize - 1) return { ...item, movingAvg: null };
            const sum = rawData.slice(idx - windowSize + 1, idx + 1).reduce((s, d) => s + d.revenue, 0);
            return { ...item, movingAvg: Math.round(sum / windowSize) };
        });
    }, [baseData, months, isSingleMonth]);

    const topProducts = useMemo(() => {
        if (level === 3) return [];
        return getTopItemsWithMoM(viewData, 'productName', months);
    }, [viewData, months, level]);

    const topShops = useMemo(() => {
        if (level !== 1) return [];
        return getTopItemsWithMoM(viewData, 'shopName', months);
    }, [viewData, months, level]);

    const topBranches = useMemo(() => {
        if (level === 1) return [];
        const byShop = {};
        viewData.forEach(t => {
            byShop[t.shopName] = (byShop[t.shopName] || 0) + t.amount;
        });
        return Object.entries(byShop)
            .map(([name, value]) => ({ name, value: Math.round(value) }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [viewData, level]);

    // Determine which trend chart to show
    const showCategoryTrend = level === 1 && trendCategories.length > 0;

    // Custom dot renderer for chart: highlight selected days
    const renderDot = useCallback((props) => {
        const { cx, cy, payload } = props;
        const day = parseInt(payload.period, 10);
        const isSelected = dayFrom !== null && dayTo !== null && day >= dayFrom && day <= dayTo;
        return (
            <circle
                cx={cx}
                cy={cy}
                r={isSelected ? 6 : 3}
                fill={isSelected ? '#f97316' : '#e8222b'}
                stroke={isSelected ? '#fff' : 'none'}
                strokeWidth={isSelected ? 2 : 0}
                style={{ cursor: 'pointer' }}
            />
        );
    }, [dayFrom, dayTo]);

    // Day filter UI section (shared between chart types)
    const dayFilterUI = isSingleMonth && availableDays.length > 0 ? (
        <div className="mt-3 pt-3 border-t border-slate-100">
            <DayFilterBar
                availableDays={availableDays}
                dayFrom={dayFrom}
                dayTo={dayTo}
                onDayClick={handleDayClick}
                onClear={handleDayClear}
            />
        </div>
    ) : null;

    return (
        <div className="space-y-5 animate-view-in">
            {/* Contextual Filters */}
            <section className="filter-bar flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="relative">
                    <label className="text-[10px] font-bold text-slate-400 absolute top-1.5 left-3 uppercase tracking-wider">Category</label>
                    <select
                        className="w-full sm:w-auto pt-5 pb-1.5 px-3 pr-8 border border-slate-200 rounded-lg appearance-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 outline-none text-sm bg-white transition-all sm:min-w-[150px]"
                        value={selectedCategory}
                        onChange={e => handleCategoryChange(e.target.value)}
                    >
                        <option value="All">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-6 text-slate-400 pointer-events-none" size={14} />
                </div>
                <div className="relative">
                    <label className="text-[10px] font-bold text-slate-400 absolute top-1.5 left-3 uppercase tracking-wider">Product</label>
                    <select
                        className="w-full sm:w-auto pt-5 pb-1.5 px-3 pr-8 border border-slate-200 rounded-lg appearance-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 outline-none text-sm bg-white transition-all sm:min-w-[180px]"
                        value={selectedProduct}
                        onChange={e => handleProductChange(e.target.value)}
                    >
                        <option value="All">All Products</option>
                        {products.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-6 text-slate-400 pointer-events-none" size={14} />
                </div>
                {(selectedCategory !== 'All' || selectedProduct !== 'All') && (
                    <button
                        onClick={() => { setSelectedCategory('All'); setSelectedProduct('All'); setDayFrom(null); setDayTo(null); }}
                        className="text-xs font-semibold text-pink-600 hover:text-pink-800 transition-colors px-2 py-1"
                    >
                        ✕ Clear
                    </button>
                )}
                <div className="ml-auto text-[10px] font-bold text-slate-400 px-2 py-1 bg-slate-50 rounded">
                    {level === 1 ? '📊 Overview' : level === 2 ? '📦 Category' : '🔍 Product Detail'}
                </div>
            </section>

            {/* KPI Cards */}
            <section className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <StatCard
                    title="Total Revenue"
                    value={`฿${Math.round(stats.totalRevenue).toLocaleString()}`}
                    numericValue={Math.round(stats.totalRevenue)}
                    icon={TrendingUp}
                    gradient="from-pink-600 via-red-500 to-orange-500"
                    subtitle="Product revenue in period"
                    mom={stats.mom}
                    yoy={stats.yoy}
                />
                <StatCard
                    title="Units Sold"
                    value={`${stats.totalQty.toLocaleString()} Units`}
                    numericValue={stats.totalQty}
                    icon={Package}
                    gradient="from-slate-600 to-slate-700"
                    subtitle="Total quantity sold"
                />
                <StatCard
                    title="Avg. Order Value"
                    value={`฿${stats.aov.toLocaleString()}`}
                    numericValue={stats.aov}
                    icon={DollarSign}
                    gradient="from-amber-500 to-amber-600"
                    subtitle={`${stats.totalTxns.toLocaleString()} transactions`}
                />
            </section>

            {/* Top Branches Bar (level 2 & 3) */}
            {level >= 2 && topBranches.length > 0 && (
                <section>
                    <ChartCard title={`Top 10 Branches — ${level === 2 ? selectedCategory : selectedProduct}`} icon={Store} iconColor="bg-gradient-to-br from-pink-600 via-red-500 to-orange-500">
                        <div className="h-[240px] sm:h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topBranches} layout="vertical" margin={{ left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} />
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} width={110} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" name="Revenue" radius={[0, 4, 4, 0]} barSize={18}>
                                        {topBranches.map((entry, idx) => (
                                            <Cell key={idx} fill={idx === 0 ? '#dc2626' : COLORS[idx % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                </section>
            )}

            {/* Revenue Trend — Category Breakdown (level 1) */}
            {showCategoryTrend && (
                <section>
                    <ChartCard
                        title={isSingleMonth ? `Revenue by Date — ${months[0]} (by Category)` : 'Revenue Trend by Category'}
                        icon={TrendingUp}
                        iconColor="bg-gradient-to-br from-pink-600 via-red-500 to-orange-500"
                    >
                        <div className="h-[240px] sm:h-[320px]">
                            {categoryTrendData.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-slate-400 text-sm">No trend data available</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={categoryTrendData} onClick={isSingleMonth ? handleChartClick : undefined}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                                        {trendCategories.map((cat, i) => (
                                            <Line
                                                key={cat}
                                                type="monotone"
                                                dataKey={cat}
                                                name={cat}
                                                stroke={COLORS[i % COLORS.length]}
                                                strokeWidth={2}
                                                dot={{ r: 3, fill: COLORS[i % COLORS.length] }}
                                                activeDot={{ r: 6, cursor: 'pointer' }}
                                                connectNulls
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        {dayFilterUI}
                    </ChartCard>
                </section>
            )}

            {/* Revenue Trend — Simple (level 2 & 3) */}
            {!showCategoryTrend && (
                <section>
                    <ChartCard
                        title={isSingleMonth ? `Revenue by Date — ${months[0]}` : 'Revenue Trend'}
                        icon={TrendingUp}
                        iconColor="bg-gradient-to-br from-pink-600 via-red-500 to-orange-500"
                    >
                        <div className="h-[200px] sm:h-[280px]">
                            {simpleTrendData.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-slate-400 text-sm">No trend data available</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={simpleTrendData} onClick={isSingleMonth ? handleChartClick : undefined}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            name="Revenue"
                                            stroke="#e8222b"
                                            strokeWidth={2}
                                            dot={isSingleMonth ? renderDot : { r: 3, fill: '#e8222b' }}
                                            activeDot={{ r: 6, cursor: 'pointer' }}
                                        />
                                        {simpleTrendData.length >= 3 && (
                                            <Line
                                                type="monotone"
                                                dataKey="movingAvg"
                                                name="3-Period Avg"
                                                stroke="#6366f1"
                                                strokeWidth={2}
                                                strokeDasharray="6 3"
                                                dot={false}
                                                connectNulls={false}
                                            />
                                        )}
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        {dayFilterUI}
                    </ChartCard>
                </section>
            )}

            {/* Top Products Table (level 1 & 2) */}
            {level !== 3 && (
                <section>
                    <DataBarTable
                        title={level === 2 ? `Top Products in ${selectedCategory}` : 'Top 10 Products'}
                        data={topProducts}
                        showMoM={months.length >= 2}
                        icon={ShoppingBag}
                        iconGradient="from-pink-600 via-red-500 to-orange-500"
                    />
                </section>
            )}

            {/* Top Shops Table (level 1 only) */}
            {level === 1 && (
                <section>
                    <DataBarTable
                        title="Top 10 Shops"
                        data={topShops}
                        showMoM={months.length >= 2}
                        icon={Store}
                        iconGradient="from-slate-600 to-slate-700"
                    />
                </section>
            )}
        </div>
    );
};

export default ProductView;
