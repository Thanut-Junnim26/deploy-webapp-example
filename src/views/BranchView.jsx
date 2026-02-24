import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer, PieChart, Pie, Cell,
    LineChart, Line
} from 'recharts';
import { Store, TrendingUp, CalendarDays, Layers, Award } from 'lucide-react';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';

const COLORS = {
    segments: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4'],
    shopSegments: { Champion: '#10b981', 'High Potential': '#3b82f6', Mass: '#f59e0b', 'At Risk': '#ef4444', Event: '#8b5cf6' }
};

const MONTH_ORDER = [
    'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25',
    'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25', 'Jan-26', 'Feb-26'
];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-xl border border-slate-100">
            <p className="font-bold text-slate-700 text-sm mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="text-xs" style={{ color: p.color }}>
                    {p.name}: <strong>{p.name?.includes('Units') ? p.value?.toLocaleString() : `฿${p.value?.toLocaleString()}`}</strong>
                </p>
            ))}
        </div>
    );
};

const BranchView = ({ filteredData, chartFilter, onChartFilter }) => {
    // --- KPIs ---
    const stats = useMemo(() => {
        const totalRevenue = filteredData.reduce((sum, t) => sum + t.amount, 0);
        const totalQty = filteredData.reduce((sum, t) => sum + t.qty, 0);
        const activeShops = new Set(filteredData.map(t => t.shopName)).size;
        const avgPerShop = activeShops > 0 ? Math.round(totalRevenue / activeShops) : 0;
        // Top segment
        const segRevenue = {};
        filteredData.forEach(t => { segRevenue[t.shopSegment] = (segRevenue[t.shopSegment] || 0) + t.amount; });
        const topSegment = Object.entries(segRevenue).sort((a, b) => b[1] - a[1])[0];
        return { totalRevenue, totalQty, activeShops, avgPerShop, topSegment: topSegment ? topSegment[0] : '-' };
    }, [filteredData]);

    // --- Revenue by Shop Segment (Bar) ---
    const segmentData = useMemo(() => {
        const bySeg = {};
        filteredData.forEach(t => { bySeg[t.shopSegment] = (bySeg[t.shopSegment] || 0) + t.amount; });
        return Object.entries(bySeg)
            .map(([name, value]) => ({ name, value: Math.round(value) }))
            .sort((a, b) => b.value - a.value);
    }, [filteredData]);

    // --- Top 15 Branches (Horizontal Bar) ---
    const branchBarData = useMemo(() => {
        const byShop = {};
        filteredData.forEach(t => { byShop[t.shopName] = (byShop[t.shopName] || 0) + t.amount; });
        return Object.entries(byShop)
            .map(([name, value]) => ({ name, value: Math.round(value) }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 15);
    }, [filteredData]);

    // --- Branch Trend Over Time (top 5) ---
    const trendData = useMemo(() => {
        const topShops = branchBarData.slice(0, 5).map(b => b.name);
        const byMonthShop = {};
        filteredData.forEach(t => {
            if (!topShops.includes(t.shopName)) return;
            if (!byMonthShop[t.month]) byMonthShop[t.month] = {};
            byMonthShop[t.month][t.shopName] = (byMonthShop[t.month][t.shopName] || 0) + t.amount;
        });
        return MONTH_ORDER
            .filter(m => byMonthShop[m])
            .map(m => ({ month: m, ...Object.fromEntries(topShops.map(s => [s, Math.round(byMonthShop[m]?.[s] || 0)])) }));
    }, [filteredData, branchBarData]);

    const topShopNames = branchBarData.slice(0, 5).map(b => b.name);

    // --- Shop Segment Distribution (Donut) ---
    const segmentDonut = useMemo(() => {
        const bySegShops = {};
        const shopSeg = {};
        filteredData.forEach(t => { shopSeg[t.shopName] = t.shopSegment; });
        Object.values(shopSeg).forEach(seg => { bySegShops[seg] = (bySegShops[seg] || 0) + 1; });
        return Object.entries(bySegShops)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredData]);

    // --- Weekend vs Weekday ---
    const weekendData = useMemo(() => {
        const groups = { Weekday: { revenue: 0, units: 0 }, Weekend: { revenue: 0, units: 0 } };
        filteredData.forEach(t => {
            const key = t.isWeekend ? 'Weekend' : 'Weekday';
            groups[key].revenue += t.amount;
            groups[key].units += t.qty;
        });
        return Object.entries(groups).map(([name, data]) => ({
            name, revenue: Math.round(data.revenue), units: data.units
        }));
    }, [filteredData]);

    // --- Branch Performance Table ---
    const branchPerformance = useMemo(() => {
        const byShop = {};
        filteredData.forEach(t => {
            if (!byShop[t.shopName]) {
                byShop[t.shopName] = { shopName: t.shopName, shopType: t.shopType, shopSegment: t.shopSegment, revenue: 0, units: 0, productCount: {}, productNameCount: {} };
            }
            byShop[t.shopName].revenue += t.amount;
            byShop[t.shopName].units += t.qty;
            byShop[t.shopName].productCount[t.productSub] = (byShop[t.shopName].productCount[t.productSub] || 0) + t.qty;
            byShop[t.shopName].productNameCount[t.productName] = (byShop[t.shopName].productNameCount[t.productName] || 0) + t.qty;
        });
        return Object.values(byShop)
            .map(shop => {
                const topProduct = Object.entries(shop.productCount).sort((a, b) => b[1] - a[1])[0];
                const topProductName = Object.entries(shop.productNameCount).sort((a, b) => b[1] - a[1])[0];
                const productDiversity = Object.keys(shop.productCount).length;
                return {
                    ...shop,
                    revenue: Math.round(shop.revenue),
                    topProduct: topProduct ? topProduct[0] : '-',
                    topProductName: topProductName ? topProductName[0] : '-',
                    productDiversity
                };
            })
            .sort((a, b) => b.revenue - a.revenue);
    }, [filteredData]);

    const handleSegmentClick = (data) => {
        if (!data?.name) return;
        if (chartFilter?.type === 'shopSegment' && chartFilter.value === data.name) {
            onChartFilter(null);
        } else {
            onChartFilter({ type: 'shopSegment', value: data.name });
        }
    };

    const handleBranchBarClick = (data) => {
        if (!data?.name) return;
        if (chartFilter?.type === 'shopName' && chartFilter.value === data.name) {
            onChartFilter(null);
        } else {
            onChartFilter({ type: 'shopName', value: data.name });
        }
    };

    const handleWeekendClick = (data) => {
        if (!data?.name) return;
        const val = data.name === 'Weekend' ? 'Weekend' : 'Weekday';
        if (chartFilter?.type === 'isWeekend' && chartFilter.value === val) {
            onChartFilter(null);
        } else {
            onChartFilter({ type: 'isWeekend', value: val });
        }
    };

    const handleBranchRowClick = (shop) => {
        if (chartFilter?.type === 'shopName' && chartFilter.value === shop.shopName) {
            onChartFilter(null);
        } else {
            onChartFilter({ type: 'shopName', value: shop.shopName });
        }
    };

    const maxBranchRevenue = branchPerformance.length > 0 ? branchPerformance[0].revenue : 1;

    return (
        <div className="space-y-6 animate-view-in">
            {/* KPI Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Revenue" value={`฿${Math.round(stats.totalRevenue).toLocaleString()}`} numericValue={Math.round(stats.totalRevenue)} icon={TrendingUp} gradient="from-blue-500 to-blue-600" subtitle="Net revenue across branches" />
                <StatCard title="Active Shops" value={stats.activeShops} numericValue={stats.activeShops} icon={Store} gradient="from-emerald-500 to-emerald-600" subtitle="Unique shops with sales" />
                <StatCard title="Avg Rev / Shop" value={`฿${stats.avgPerShop.toLocaleString()}`} numericValue={stats.avgPerShop} icon={Layers} gradient="from-violet-500 to-violet-600" subtitle="Average per branch" />
                <StatCard title="Top Segment" value={stats.topSegment} icon={Award} gradient="from-amber-500 to-orange-500" subtitle="Highest revenue segment" />
            </section>

            {/* Charts Row 1: Segment Bar + Top Branches */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Revenue by Shop Segment" icon={Store} iconColor="bg-gradient-to-br from-emerald-500 to-emerald-600">
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={segmentData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" name="Revenue" radius={[6, 6, 0, 0]} barSize={45} cursor="pointer" onClick={(data) => handleSegmentClick(data)}>
                                    {segmentData.map((entry, idx) => (
                                        <Cell
                                            key={idx}
                                            fill={COLORS.shopSegments[entry.name] || COLORS.segments[idx % COLORS.segments.length]}
                                            opacity={chartFilter?.type === 'shopSegment' && chartFilter.value !== entry.name ? 0.3 : 1}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                <ChartCard title="Top 15 Branches by Revenue" icon={TrendingUp} iconColor="bg-gradient-to-br from-blue-500 to-blue-600">
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={branchBarData} layout="vertical" margin={{ left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} />
                                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} width={100} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" name="Revenue" radius={[0, 6, 6, 0]} barSize={16} cursor="pointer" onClick={(data) => handleBranchBarClick(data)}>
                                    {branchBarData.map((entry, idx) => (
                                        <Cell
                                            key={idx}
                                            fill={chartFilter?.type === 'shopName' && chartFilter.value === entry.name ? '#1e40af' : '#3b82f6'}
                                            opacity={chartFilter?.type === 'shopName' && chartFilter.value !== entry.name ? 0.3 : 1}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </section>

            {/* Charts Row 2: Branch Trend + Segment Donut + Weekend */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartCard title="Top Branch Trends" icon={TrendingUp} iconColor="bg-gradient-to-br from-indigo-500 to-indigo-600" className="lg:col-span-2">
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                                {topShopNames.map((shop, idx) => (
                                    <Line key={shop} type="monotone" dataKey={shop} name={shop} stroke={COLORS.segments[idx]} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                <div className="space-y-6">
                    <ChartCard title="Segment Distribution" icon={Layers} iconColor="bg-gradient-to-br from-amber-500 to-orange-500">
                        <div className="h-[110px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={segmentDonut} cx="50%" cy="50%" innerRadius={30} outerRadius={48} paddingAngle={3} dataKey="value" cursor="pointer" onClick={(data) => handleSegmentClick(data)}>
                                        {segmentDonut.map((entry, idx) => (
                                            <Cell key={idx} fill={COLORS.shopSegments[entry.name] || COLORS.segments[idx]} opacity={chartFilter?.type === 'shopSegment' && chartFilter.value !== entry.name ? 0.3 : 1} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v) => [`${v} shops`, 'Count']} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {segmentDonut.map((s, i) => (
                                <span key={i} className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${COLORS.shopSegments[s.name] || COLORS.segments[i]}15`, color: COLORS.shopSegments[s.name] || COLORS.segments[i] }}>
                                    {s.name}: {s.value}
                                </span>
                            ))}
                        </div>
                    </ChartCard>

                    <ChartCard title="Weekend vs Weekday" icon={CalendarDays} iconColor="bg-gradient-to-br from-cyan-500 to-cyan-600">
                        <div className="h-[100px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weekendData}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="revenue" name="Revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={35} cursor="pointer" onClick={(data) => handleWeekendClick(data)}>
                                        {weekendData.map((entry) => (
                                            <Cell key={entry.name} fill={entry.name === 'Weekend' ? '#f59e0b' : '#06b6d4'} opacity={chartFilter?.type === 'isWeekend' && chartFilter.value !== entry.name ? 0.3 : 1} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                </div>
            </section>

            {/* Branch Performance Table */}
            <section className="chart-card overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-bold flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                            <Award size={16} className="text-white" />
                        </div>
                        <span className="text-slate-700">Branch Performance Ranking</span>
                    </h3>
                    <span className="text-xs text-slate-400 font-bold">{branchPerformance.length} shops</span>
                </div>
                <div className="overflow-x-auto -mx-5 px-5">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                                <th className="pb-3 pr-3">#</th>
                                <th className="pb-3 pr-3">Shop Name</th>
                                <th className="pb-3 pr-3">Type</th>
                                <th className="pb-3 pr-3">Segment</th>
                                <th className="pb-3 pr-3 text-right">Revenue</th>
                                <th className="pb-3 pr-3 text-right">Units</th>
                                <th className="pb-3 pr-3">Top Category</th>
                                <th className="pb-3 pr-3">Top Product</th>
                                <th className="pb-3">Diversity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {branchPerformance.map((shop, idx) => (
                                <tr
                                    key={idx}
                                    className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${chartFilter?.type === 'shopName' && chartFilter.value === shop.shopName ? 'bg-blue-50/60' : ''}`}
                                    onClick={() => handleBranchRowClick(shop)}
                                >
                                    <td className="py-2.5 pr-3">
                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${idx < 3 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {idx + 1}
                                        </span>
                                    </td>
                                    <td className="py-2.5 pr-3 font-semibold text-slate-700 text-xs max-w-[150px] truncate">{shop.shopName}</td>
                                    <td className="py-2.5 pr-3">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${shop.shopType === 'WW' ? 'bg-indigo-50 text-indigo-600' : shop.shopType.includes('สเฟียร์') ? 'bg-cyan-50 text-cyan-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {shop.shopType}
                                        </span>
                                    </td>
                                    <td className="py-2.5 pr-3">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${shop.shopSegment === 'Champion' ? 'bg-emerald-50 text-emerald-700' : shop.shopSegment === 'High Potential' ? 'bg-blue-50 text-blue-700' : shop.shopSegment === 'At Risk' ? 'bg-rose-50 text-rose-700' : shop.shopSegment === 'Event' ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {shop.shopSegment}
                                        </span>
                                    </td>
                                    <td className="py-2.5 pr-3 text-right font-mono text-xs font-bold text-slate-700">฿{shop.revenue.toLocaleString()}</td>
                                    <td className="py-2.5 pr-3 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <div className="w-14 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full" style={{ width: `${(shop.revenue / maxBranchRevenue) * 100}%` }} />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 w-8 text-right">{shop.units}</span>
                                        </div>
                                    </td>
                                    <td className="py-2.5 pr-3">
                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-medium">{shop.topProduct}</span>
                                    </td>
                                    <td className="py-2.5 pr-3">
                                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md font-medium max-w-[120px] truncate inline-block">{shop.topProductName}</span>
                                    </td>
                                    <td className="py-2.5">
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(shop.productDiversity, 7) }).map((_, i) => (
                                                <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.segments[i % COLORS.segments.length] }} />
                                            ))}
                                            <span className="text-[10px] text-slate-400 ml-0.5">{shop.productDiversity}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {branchPerformance.length === 0 && (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center text-slate-400">
                                        No data found matching current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default BranchView;
