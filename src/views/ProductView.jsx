import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer, PieChart, Pie, Cell,
    LineChart, Line
} from 'recharts';
import { TrendingUp, Package, Layers, ShoppingBag } from 'lucide-react';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';

const COLORS = {
    segments: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4'],
    tiers: { Premium: '#6366f1', Hero: '#f59e0b', Mass: '#10b981' }
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
                    {p.name}: <strong>฿{p.value?.toLocaleString()}</strong>
                </p>
            ))}
        </div>
    );
};

const ProductView = ({ filteredData, chartFilter, onChartFilter }) => {
    // --- KPIs ---
    const stats = useMemo(() => {
        const totalRevenue = filteredData.reduce((sum, t) => sum + t.amount, 0);
        const totalQty = filteredData.reduce((sum, t) => sum + t.qty, 0);
        const products = new Set(filteredData.map(t => t.productName)).size;
        const categories = new Set(filteredData.map(t => t.productSub)).size;
        const avgPerProduct = products > 0 ? Math.round(totalRevenue / products) : 0;
        return { totalRevenue, totalQty, products, categories, avgPerProduct };
    }, [filteredData]);

    // --- Revenue by Product Category (Horizontal Bar) ---
    const categoryData = useMemo(() => {
        const byCat = {};
        filteredData.forEach(t => {
            byCat[t.productSub] = (byCat[t.productSub] || 0) + t.amount;
        });
        return Object.entries(byCat)
            .map(([name, value]) => ({ name, value: Math.round(value) }))
            .sort((a, b) => b.value - a.value);
    }, [filteredData]);

    // --- Product Trend Over Time (multi-line) ---
    const trendData = useMemo(() => {
        const topCategories = categoryData.slice(0, 5).map(c => c.name);
        const byMonthCat = {};
        filteredData.forEach(t => {
            if (!topCategories.includes(t.productSub)) return;
            if (!byMonthCat[t.month]) byMonthCat[t.month] = {};
            byMonthCat[t.month][t.productSub] = (byMonthCat[t.month][t.productSub] || 0) + t.amount;
        });
        return MONTH_ORDER
            .filter(m => byMonthCat[m])
            .map(m => ({ month: m, ...Object.fromEntries(topCategories.map(c => [c, Math.round(byMonthCat[m]?.[c] || 0)])) }));
    }, [filteredData, categoryData]);

    const topCategories = categoryData.slice(0, 5).map(c => c.name);

    // --- Product Tier Distribution (Donut) ---
    const tierData = useMemo(() => {
        const byTier = {};
        filteredData.forEach(t => {
            byTier[t.productSegment] = (byTier[t.productSegment] || 0) + t.amount;
        });
        return Object.entries(byTier)
            .map(([name, value]) => ({ name, value: Math.round(value) }))
            .sort((a, b) => b.value - a.value);
    }, [filteredData]);

    // --- Top Products Table ---
    const topProducts = useMemo(() => {
        const byProduct = {};
        filteredData.forEach(t => {
            if (!byProduct[t.productName]) {
                byProduct[t.productName] = { name: t.productName, category: t.productSub, tier: t.productSegment, revenue: 0, qty: 0, shops: new Set() };
            }
            byProduct[t.productName].revenue += t.amount;
            byProduct[t.productName].qty += t.qty;
            byProduct[t.productName].shops.add(t.shopName);
        });
        const totalRev = filteredData.reduce((s, t) => s + t.amount, 0);
        return Object.values(byProduct)
            .map(p => ({ ...p, shops: p.shops.size, share: totalRev > 0 ? ((p.revenue / totalRev) * 100).toFixed(1) : '0' }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 15);
    }, [filteredData]);

    const handleCategoryClick = (data) => {
        if (!data?.name) return;
        if (chartFilter?.type === 'productSub' && chartFilter.value === data.name) {
            onChartFilter(null);
        } else {
            onChartFilter({ type: 'productSub', value: data.name });
        }
    };

    const handleTierClick = (data) => {
        if (!data?.name) return;
        if (chartFilter?.type === 'productSegment' && chartFilter.value === data.name) {
            onChartFilter(null);
        } else {
            onChartFilter({ type: 'productSegment', value: data.name });
        }
    };

    const handleProductRowClick = (product) => {
        if (chartFilter?.type === 'productName' && chartFilter.value === product.name) {
            onChartFilter(null);
        } else {
            onChartFilter({ type: 'productName', value: product.name });
        }
    };

    const maxRevenue = topProducts.length > 0 ? topProducts[0].revenue : 1;

    return (
        <div className="space-y-6 animate-view-in">
            {/* KPI Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Revenue" value={`฿${Math.round(stats.totalRevenue).toLocaleString()}`} numericValue={Math.round(stats.totalRevenue)} icon={TrendingUp} gradient="from-blue-500 to-blue-600" subtitle="Product revenue in period" />
                <StatCard title="Units Sold" value={`${stats.totalQty.toLocaleString()} Units`} numericValue={stats.totalQty} icon={Package} gradient="from-violet-500 to-violet-600" subtitle="Total quantity sold" />
                <StatCard title="Products" value={stats.products} numericValue={stats.products} icon={ShoppingBag} gradient="from-emerald-500 to-emerald-600" subtitle="Distinct products" />
                <StatCard title="Avg Rev / Product" value={`฿${stats.avgPerProduct.toLocaleString()}`} numericValue={stats.avgPerProduct} icon={Layers} gradient="from-amber-500 to-orange-500" subtitle="Average revenue per product" />
            </section>

            {/* Charts Row 1: Category Bar + Trend Line */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Revenue by Product Category" icon={Package} iconColor="bg-gradient-to-br from-violet-500 to-violet-600">
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} />
                                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} width={90} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey="value"
                                    name="Revenue"
                                    radius={[0, 6, 6, 0]}
                                    barSize={28}
                                    cursor="pointer"
                                    onClick={(data) => handleCategoryClick(data)}
                                >
                                    {categoryData.map((entry, idx) => (
                                        <Cell
                                            key={idx}
                                            fill={chartFilter?.type === 'productSub' && chartFilter.value === entry.name ? '#4f46e5' : COLORS.segments[idx % COLORS.segments.length]}
                                            opacity={chartFilter?.type === 'productSub' && chartFilter.value !== entry.name ? 0.35 : 1}
                                            className="transition-all duration-300"
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                <ChartCard title="Product Trend Over Time" icon={TrendingUp} iconColor="bg-gradient-to-br from-blue-500 to-blue-600">
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                                {topCategories.map((cat, idx) => (
                                    <Line
                                        key={cat}
                                        type="monotone"
                                        dataKey={cat}
                                        name={cat}
                                        stroke={COLORS.segments[idx % COLORS.segments.length]}
                                        strokeWidth={2.5}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </section>

            {/* Charts Row 2: Tier Donut */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartCard title="Product Tier Distribution" icon={Layers} iconColor="bg-gradient-to-br from-amber-500 to-orange-500">
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={tierData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={90}
                                    paddingAngle={4}
                                    dataKey="value"
                                    cursor="pointer"
                                    onClick={(data) => handleTierClick(data)}
                                >
                                    {tierData.map((entry, idx) => (
                                        <Cell
                                            key={idx}
                                            fill={COLORS.tiers[entry.name] || COLORS.segments[idx % COLORS.segments.length]}
                                            opacity={chartFilter?.type === 'productSegment' && chartFilter.value !== entry.name ? 0.3 : 1}
                                            stroke={chartFilter?.type === 'productSegment' && chartFilter.value === entry.name ? '#1e293b' : 'transparent'}
                                            strokeWidth={2}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`฿${value.toLocaleString()}`, 'Revenue']} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Top Products Table */}
                <div className="lg:col-span-2 chart-card overflow-hidden">
                    <h3 className="text-base font-bold mb-4 flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600">
                            <ShoppingBag size={16} className="text-white" />
                        </div>
                        <span className="text-slate-700">Top Products</span>
                        <span className="ml-auto text-xs text-slate-400 font-normal">{topProducts.length} products</span>
                    </h3>
                    <div className="overflow-x-auto -mx-5 px-5">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                                    <th className="pb-3 pr-4">#</th>
                                    <th className="pb-3 pr-4">Product</th>
                                    <th className="pb-3 pr-4">Category</th>
                                    <th className="pb-3 pr-4">Tier</th>
                                    <th className="pb-3 pr-4 text-right">Revenue</th>
                                    <th className="pb-3 pr-4 text-right">Units</th>
                                    <th className="pb-3 pr-4 text-right">Share</th>
                                    <th className="pb-3">Revenue Bar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {topProducts.map((p, idx) => (
                                    <tr
                                        key={idx}
                                        className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${chartFilter?.type === 'productName' && chartFilter.value === p.name ? 'bg-indigo-50/60' : ''}`}
                                        onClick={() => handleProductRowClick(p)}
                                    >
                                        <td className="py-2.5 pr-4">
                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${idx < 3 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {idx + 1}
                                            </span>
                                        </td>
                                        <td className="py-2.5 pr-4 font-semibold text-slate-700 text-xs max-w-[160px] truncate">{p.name}</td>
                                        <td className="py-2.5 pr-4">
                                            <span className="text-[10px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-md font-bold">{p.category}</span>
                                        </td>
                                        <td className="py-2.5 pr-4">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${p.tier === 'Premium' ? 'bg-indigo-50 text-indigo-600' : p.tier === 'Hero' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{p.tier}</span>
                                        </td>
                                        <td className="py-2.5 pr-4 text-right font-mono text-xs font-bold text-slate-700">฿{Math.round(p.revenue).toLocaleString()}</td>
                                        <td className="py-2.5 pr-4 text-right text-xs text-slate-500">{p.qty.toLocaleString()}</td>
                                        <td className="py-2.5 pr-4 text-right text-xs font-bold text-slate-500">{p.share}%</td>
                                        <td className="py-2.5">
                                            <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500" style={{ width: `${(p.revenue / maxRevenue) * 100}%` }} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ProductView;
