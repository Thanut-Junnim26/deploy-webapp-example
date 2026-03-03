import React, { useMemo, useState, useCallback } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Store, TrendingUp, Package, ShoppingBag, ChevronDown, Calendar, AlertTriangle, DollarSign } from 'lucide-react';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import DataBarTable from '../components/DataBarTable';
import HeatMap from '../components/HeatMap';

const COLORS = ['#dc2626', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#0ea5e9'];

const MONTH_ORDER = [
    'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25',
    'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25', 'Jan-26', 'Feb-26'
];

const SEGMENT_COLORS = {
    Champion: { bg: 'bg-emerald-50 text-emerald-700', color: '#10b981' },
    'High Potential': { bg: 'bg-blue-50 text-blue-700', color: '#3b82f6' },
    Mass: { bg: 'bg-amber-50 text-amber-700', color: '#f59e0b' },
    'At Risk': { bg: 'bg-red-50 text-red-700', color: '#ef4444' },
    Event: { bg: 'bg-violet-50 text-violet-700', color: '#8b5cf6' },
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-slate-200">
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

// Inactive Shop Alert Component
const InactiveShopAlert = ({ shops, periodLabel, onShopClick }) => {
    const [expanded, setExpanded] = useState(false);
    const byType = {};
    shops.forEach(s => {
        if (!byType[s.shopType]) byType[s.shopType] = [];
        byType[s.shopType].push(s.shopName);
    });

    return (
        <section className="chart-card border-l-4 border-l-amber-400 overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-3 text-left"
            >
                <div className="p-2 rounded-lg bg-amber-50">
                    <AlertTriangle size={16} className="text-amber-500" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-700">
                        Inactive Shops
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                            {shops.length}
                        </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">Shops with zero transactions {periodLabel}</p>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                />
            </button>
            {expanded && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                    {Object.entries(byType).sort().map(([type, names]) => (
                        <div key={type}>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{type} ({names.length})</p>
                            <div className="flex flex-wrap gap-1.5">
                                {names.sort().map(name => (
                                    <button
                                        key={name}
                                        onClick={(e) => { e.stopPropagation(); onShopClick?.(type, name); }}
                                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-100 font-medium cursor-pointer hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-all duration-150"
                                        title={`Filter to ${name}`}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

const ShopView = ({ filteredData, allTransactions, startMonth, endMonth }) => {
    const [selectedShopType, setSelectedShopType] = useState('All');
    const [selectedShop, setSelectedShop] = useState('All');
    const [dayFrom, setDayFrom] = useState(null);
    const [dayTo, setDayTo] = useState(null);

    const shopTypes = useMemo(() => [...new Set(filteredData.map(t => t.shopType).filter(Boolean))].sort(), [filteredData]);

    const allShopCount = useMemo(() => {
        const data = selectedShopType !== 'All'
            ? allTransactions.filter(t => t.shopType === selectedShopType)
            : allTransactions;
        return new Set(data.map(t => `${t.shopType}|||${t.shopName}`)).size;
    }, [allTransactions, selectedShopType]);

    const shopNames = useMemo(() => {
        let data = filteredData;
        if (selectedShopType !== 'All') data = data.filter(t => t.shopType === selectedShopType);
        return [...new Set(data.map(t => t.shopName).filter(Boolean))].sort();
    }, [filteredData, selectedShopType]);

    // Base data: filtered by shopType/shop but NOT by day (for chart)
    const baseData = useMemo(() => {
        let data = filteredData;
        if (selectedShopType !== 'All') data = data.filter(t => t.shopType === selectedShopType);
        if (selectedShop !== 'All') data = data.filter(t => t.shopName === selectedShop);
        return data;
    }, [filteredData, selectedShopType, selectedShop]);

    // viewData: base data + day filter applied (for stats, tables, etc.)
    const viewData = useMemo(() => {
        if (dayFrom === null) return baseData;
        return baseData.filter(t => t.invoiceDay >= dayFrom && t.invoiceDay <= dayTo);
    }, [baseData, dayFrom, dayTo]);

    const handleShopTypeChange = (val) => {
        setSelectedShopType(val);
        setSelectedShop('All');
        setDayFrom(null);
        setDayTo(null);
    };

    const handleShopChange = (val) => {
        setSelectedShop(val);
        setDayFrom(null);
        setDayTo(null);
    };

    const handleInactiveShopClick = (shopType, shopName) => {
        setSelectedShopType(shopType);
        setSelectedShop(shopName);
        setDayFrom(null);
        setDayTo(null);
    };

    const level = selectedShop !== 'All' ? 3 : selectedShopType !== 'All' ? 2 : 1;
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
            // First click: select single day
            setDayFrom(day);
            setDayTo(day);
        } else if (dayFrom === day && dayTo === day) {
            // Click same day again: clear
            setDayFrom(null);
            setDayTo(null);
        } else if (dayFrom !== null && dayTo === dayFrom) {
            // Second click: set range
            const from = Math.min(dayFrom, day);
            const to = Math.max(dayFrom, day);
            setDayFrom(from);
            setDayTo(to);
        } else {
            // Already a range: start fresh
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
        const activeShops = new Set(viewData.map(t => `${t.shopType}|||${t.shopName}`)).size;
        const byMonth = {};
        viewData.forEach(t => { byMonth[t.month] = (byMonth[t.month] || 0) + t.amount; });
        const mom = calcMoM(byMonth, months);
        const yoy = calcYoY(byMonth, months);
        let shopSegment = null;
        if (level === 3 && viewData.length > 0) shopSegment = viewData[0].shopSegment;
        return { totalRevenue, totalQty, totalTxns, aov, activeShops, mom, yoy, shopSegment };
    }, [viewData, months, level]);

    // Trend data: always uses baseData (NOT day-filtered) so chart is always full
    const trendData = useMemo(() => {
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

    // Inactive shops: when viewing all data, check last 3 months; when filtered, check filter period
    const inactiveShopsList = useMemo(() => {
        if (level === 3) return { shops: [], periodLabel: '' };

        // Determine the pool of shops to check (scoped to selected shopType)
        const relevantTransactions = selectedShopType !== 'All'
            ? allTransactions.filter(t => t.shopType === selectedShopType)
            : allTransactions;

        const allShopPairs = new Set(relevantTransactions.map(t => `${t.shopType}|||${t.shopName}`));

        // Check if month filter is applied (using actual filter props, not month count)
        const isMonthFiltered = startMonth !== 'All' || endMonth !== 'All';

        // Get all available months for the relevant shop type pool
        const allAvailableMonths = [...new Set(relevantTransactions.map(t => t.month))]
            .sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));

        let activePool;
        let periodLabel;
        if (isMonthFiltered) {
            // Use the filtered data
            activePool = baseData;
            periodLabel = 'in the selected period';
        } else {
            // Use last 3 months of data for this shop type
            const last3 = allAvailableMonths.slice(-3);
            activePool = relevantTransactions.filter(t => last3.includes(t.month));
            periodLabel = `in the last 3 months (${last3.join(', ')})`;
        }

        const activeShopPairs = new Set(activePool.map(t => `${t.shopType}|||${t.shopName}`));

        return {
            shops: [...allShopPairs]
                .filter(pair => !activeShopPairs.has(pair))
                .map(pair => {
                    const [type, name] = pair.split('|||');
                    return { shopType: type, shopName: name };
                })
                .sort((a, b) => a.shopName.localeCompare(b.shopName)),
            periodLabel
        };
    }, [allTransactions, baseData, months, selectedShopType, level, startMonth, endMonth]);

    const topProducts = useMemo(() => getTopItemsWithMoM(viewData, 'productName', months), [viewData, months]);
    const topShops = useMemo(() => {
        if (level === 3) return [];
        return getTopItemsWithMoM(viewData, 'shopName', months);
    }, [viewData, months, level]);

    const heatMapData = useMemo(() => {
        if (level !== 2) return [];
        const byShopMonth = {};
        viewData.forEach(t => {
            if (!byShopMonth[t.shopName]) byShopMonth[t.shopName] = { name: t.shopName };
            byShopMonth[t.shopName][t.month] = (byShopMonth[t.shopName][t.month] || 0) + t.amount;
        });
        return Object.values(byShopMonth)
            .map(row => {
                const total = months.reduce((s, m) => s + (row[m] || 0), 0);
                return { ...row, _total: total };
            })
            .sort((a, b) => b._total - a._total)
            .slice(0, 20);
    }, [viewData, level, months]);

    const categoryPieData = useMemo(() => {
        if (level !== 3) return [];
        const byCat = {};
        viewData.forEach(t => { byCat[t.productSub] = (byCat[t.productSub] || 0) + t.amount; });
        return Object.entries(byCat)
            .map(([name, value]) => ({ name, value: Math.round(value) }))
            .sort((a, b) => b.value - a.value);
    }, [viewData, level]);

    const statusBadge = level === 3 && stats.shopSegment ? {
        label: stats.shopSegment,
        color: SEGMENT_COLORS[stats.shopSegment]?.bg || 'bg-slate-100 text-slate-600'
    } : undefined;

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

    return (
        <div className="space-y-5 animate-view-in">
            {/* Contextual Filters */}
            <section className="filter-bar flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="relative">
                    <label className="text-[10px] font-bold text-slate-400 absolute top-1.5 left-3 uppercase tracking-wider">Shop Type</label>
                    <select
                        className="w-full sm:w-auto pt-5 pb-1.5 px-3 pr-8 border border-slate-200 rounded-lg appearance-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 outline-none text-sm bg-white transition-all sm:min-w-[150px]"
                        value={selectedShopType}
                        onChange={e => handleShopTypeChange(e.target.value)}
                    >
                        <option value="All">All Types</option>
                        {shopTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-6 text-slate-400 pointer-events-none" size={14} />
                </div>
                <div className="relative">
                    <label className="text-[10px] font-bold text-slate-400 absolute top-1.5 left-3 uppercase tracking-wider">Shop</label>
                    <select
                        className="w-full sm:w-auto pt-5 pb-1.5 px-3 pr-8 border border-slate-200 rounded-lg appearance-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 outline-none text-sm bg-white transition-all sm:min-w-[180px]"
                        value={selectedShop}
                        onChange={e => handleShopChange(e.target.value)}
                    >
                        <option value="All">All Shops</option>
                        {shopNames.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-6 text-slate-400 pointer-events-none" size={14} />
                </div>
                {(selectedShopType !== 'All' || selectedShop !== 'All') && (
                    <button
                        onClick={() => { setSelectedShopType('All'); setSelectedShop('All'); setDayFrom(null); setDayTo(null); }}
                        className="text-xs font-semibold text-pink-600 hover:text-pink-800 transition-colors px-2 py-1"
                    >
                        ✕ Clear
                    </button>
                )}
                <div className="ml-auto text-[10px] font-bold text-slate-400 px-2 py-1 bg-slate-50 rounded">
                    {level === 1 ? '📊 Overview' : level === 2 ? '🏪 Shop Type' : '🔍 Shop Detail'}
                </div>
            </section>

            {/* KPI Cards */}
            <section className={`grid grid-cols-2 ${level === 3 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-4'} gap-3 sm:gap-4`}>
                <StatCard
                    title="Total Revenue"
                    value={`฿${Math.round(stats.totalRevenue).toLocaleString()}`}
                    numericValue={Math.round(stats.totalRevenue)}
                    icon={TrendingUp}
                    gradient="from-pink-600 via-red-500 to-orange-500"
                    subtitle="Net revenue in period"
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
                {level !== 3 ? (
                    <StatCard
                        title="Active / All Shops"
                        value={`${stats.activeShops} / ${allShopCount}`}
                        icon={Store}
                        gradient="from-emerald-500 to-emerald-600"
                        subtitle={`${((stats.activeShops / allShopCount) * 100).toFixed(0)}% of total shops active`}
                    />
                ) : (
                    <StatCard
                        title="Status"
                        value={stats.shopSegment || '—'}
                        icon={Store}
                        gradient="from-emerald-500 to-emerald-600"
                        subtitle="Shop segment classification"
                        statusBadge={statusBadge}
                    />
                )}
            </section>

            {/* Revenue Trend */}
            <section>
                <ChartCard
                    title={isSingleMonth ? `Revenue by Date — ${months[0]}` : 'Revenue Trend'}
                    icon={TrendingUp}
                    iconColor="bg-gradient-to-br from-pink-600 via-red-500 to-orange-500"
                >
                    <div className="h-[200px] sm:h-[280px]">
                        {trendData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm">No trend data available</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} onClick={isSingleMonth ? handleChartClick : undefined}>
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
                                    {trendData.length >= 3 && (
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
                    {/* Inline day filter */}
                    {isSingleMonth && availableDays.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                            <DayFilterBar
                                availableDays={availableDays}
                                dayFrom={dayFrom}
                                dayTo={dayTo}
                                onDayClick={handleDayClick}
                                onClear={handleDayClear}
                            />
                        </div>
                    )}
                </ChartCard>
            </section>

            {/* Level 2: Heat Map */}
            {level === 2 && (
                <section>
                    <HeatMap
                        data={heatMapData}
                        months={months}
                        title={`Revenue Heat Map — ${selectedShopType}`}
                    />
                </section>
            )}

            {/* Level 3: Product Category Pie */}
            {level === 3 && categoryPieData.length > 0 && (
                <section>
                    <ChartCard title="Product Category Mix" icon={ShoppingBag} iconColor="bg-gradient-to-br from-pink-600 via-red-500 to-orange-500">
                        <div className="h-[220px] sm:h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={95}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {categoryPieData.map((entry, idx) => (
                                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`฿${value.toLocaleString()}`, 'Revenue']} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                </section>
            )}

            {/* Top Products Table */}
            <section>
                <DataBarTable
                    title={level === 3 ? 'Top Products' : 'Top 10 Products'}
                    data={topProducts}
                    showMoM={months.length >= 2}
                    icon={ShoppingBag}
                    iconGradient="from-pink-600 via-red-500 to-orange-500"
                />
            </section>

            {/* Top Shops Table (level 1 & 2) */}
            {level !== 3 && (
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

            {/* Inactive Shop Alert */}
            {inactiveShopsList.shops?.length > 0 && level !== 3 && (
                <InactiveShopAlert shops={inactiveShopsList.shops} periodLabel={inactiveShopsList.periodLabel} onShopClick={handleInactiveShopClick} />
            )}
        </div>
    );
};

export default ShopView;
