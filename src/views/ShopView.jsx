import React, { useMemo, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Store, TrendingUp, Package, ShoppingBag, ChevronDown } from 'lucide-react';
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

const ShopView = ({ filteredData, allShopCount, selectedMonth }) => {
    const [selectedShopType, setSelectedShopType] = useState('All');
    const [selectedShop, setSelectedShop] = useState('All');

    const shopTypes = useMemo(() => [...new Set(filteredData.map(t => t.shopType).filter(Boolean))].sort(), [filteredData]);
    const shopNames = useMemo(() => {
        let data = filteredData;
        if (selectedShopType !== 'All') data = data.filter(t => t.shopType === selectedShopType);
        return [...new Set(data.map(t => t.shopName).filter(Boolean))].sort();
    }, [filteredData, selectedShopType]);

    const viewData = useMemo(() => {
        let data = filteredData;
        if (selectedShopType !== 'All') data = data.filter(t => t.shopType === selectedShopType);
        if (selectedShop !== 'All') data = data.filter(t => t.shopName === selectedShop);
        return data;
    }, [filteredData, selectedShopType, selectedShop]);

    const handleShopTypeChange = (val) => {
        setSelectedShopType(val);
        setSelectedShop('All');
    };

    const level = selectedShop !== 'All' ? 3 : selectedShopType !== 'All' ? 2 : 1;
    const months = useMemo(() => getSortedMonths(viewData), [viewData]);

    const stats = useMemo(() => {
        const totalRevenue = viewData.reduce((s, t) => s + t.amount, 0);
        const totalQty = viewData.reduce((s, t) => s + t.qty, 0);
        const activeShops = new Set(viewData.map(t => t.shopName)).size;
        const byMonth = {};
        viewData.forEach(t => { byMonth[t.month] = (byMonth[t.month] || 0) + t.amount; });
        const mom = calcMoM(byMonth, months);
        const yoy = calcYoY(byMonth, months);
        let shopSegment = null;
        if (level === 3 && viewData.length > 0) shopSegment = viewData[0].shopSegment;
        return { totalRevenue, totalQty, activeShops, mom, yoy, shopSegment };
    }, [viewData, months, level]);

    const trendData = useMemo(() => {
        const byMonth = {};
        viewData.forEach(t => { byMonth[t.month] = (byMonth[t.month] || 0) + t.amount; });
        return months.map(m => ({ month: m, revenue: Math.round(byMonth[m] || 0) }));
    }, [viewData, months]);

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

    return (
        <div className="space-y-5 animate-view-in">
            {/* Contextual Filters */}
            <section className="filter-bar flex flex-wrap items-center gap-3">
                <div className="relative">
                    <label className="text-[10px] font-bold text-slate-400 absolute top-1.5 left-3 uppercase tracking-wider">Shop Type</label>
                    <select
                        className="pt-5 pb-1.5 px-3 pr-8 border border-slate-200 rounded-lg appearance-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 outline-none text-sm bg-white transition-all min-w-[150px]"
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
                        className="pt-5 pb-1.5 px-3 pr-8 border border-slate-200 rounded-lg appearance-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 outline-none text-sm bg-white transition-all min-w-[180px]"
                        value={selectedShop}
                        onChange={e => setSelectedShop(e.target.value)}
                    >
                        <option value="All">All Shops</option>
                        {shopNames.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-6 text-slate-400 pointer-events-none" size={14} />
                </div>
                {(selectedShopType !== 'All' || selectedShop !== 'All') && (
                    <button
                        onClick={() => { setSelectedShopType('All'); setSelectedShop('All'); }}
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
            <section className={`grid grid-cols-1 ${level === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-4`}>
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
                <ChartCard title="Revenue Trend" icon={TrendingUp} iconColor="bg-gradient-to-br from-pink-600 via-red-500 to-orange-500">
                    <div className="h-[280px]">
                        {trendData.length <= 1 ? (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                                {trendData.length === 1 ? `Single period: ฿${trendData[0].revenue.toLocaleString()}` : 'No trend data available'}
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#e8222b" strokeWidth={2} dot={{ r: 3, fill: '#e8222b' }} activeDot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
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
                        <div className="h-[280px]">
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
        </div>
    );
};

export default ShopView;
