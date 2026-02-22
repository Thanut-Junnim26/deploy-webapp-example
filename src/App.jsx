import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  LayoutDashboard, Store, Package, AlertCircle, CheckCircle2,
  TrendingUp, Upload, Search, ChevronDown, Layers, CalendarDays
} from 'lucide-react';
import { fetchTransactions } from './data/fetchTransactions';

// --- Color Palette ---
const COLORS = {
  blue: '#3b82f6',
  emerald: '#10b981',
  violet: '#8b5cf6',
  rose: '#ef4444',
  orange: '#f97316',
  indigo: '#6366f1',
  amber: '#f59e0b',
  cyan: '#06b6d4',
  segments: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316']
};

// --- Month ordering for chronological sort ---
const MONTH_ORDER = [
  'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25',
  'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25', 'Jan-26', 'Feb-26'
];

const App = () => {
  // --- Data State ---
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Filter State ---
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedShopType, setSelectedShopType] = useState('All');
  const [selectedShopSegment, setSelectedShopSegment] = useState('All');
  const [selectedProductSub, setSelectedProductSub] = useState('All');
  const [selectedProductSegment, setSelectedProductSegment] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- Refs ---
  const fileInputRef = useRef(null);
  const searchRef = useRef(null);

  // --- Fetch data from Google Sheets ---
  useEffect(() => {
    fetchTransactions()
      .then((data) => {
        setTransactions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch transactions:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // --- File Import (fallback) ---
  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data)) {
          setTransactions(data);
          setError(null);
          alert(`Imported ${data.length} transactions successfully!`);
        } else {
          alert('Invalid format: expected a JSON array of transactions.');
        }
      } catch (err) {
        alert('Failed to parse file. Please upload a valid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- Click outside to close suggestions ---
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Distinct values for filter dropdowns ---
  const distinctValues = useMemo(() => {
    const unique = (key) => [...new Set(transactions.map((t) => t[key]).filter(Boolean))];
    const months = unique('month').sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));
    return {
      months,
      shopTypes: unique('shopType').sort(),
      shopSegments: unique('shopSegment').sort(),
      productSubs: unique('productSub').sort(),
      productSegments: unique('productSegment').sort(),
      shopNames: unique('shopName').sort()
    };
  }, [transactions]);

  // --- Autocomplete suggestions ---
  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return distinctValues.shopNames
      .filter((name) => name.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 8);
  }, [searchTerm, distinctValues.shopNames]);

  // --- Filtered transactions ---
  const filteredData = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedMonth !== 'All' && t.month !== selectedMonth) return false;
      if (selectedShopType !== 'All' && t.shopType !== selectedShopType) return false;
      if (selectedShopSegment !== 'All' && t.shopSegment !== selectedShopSegment) return false;
      if (selectedProductSub !== 'All' && t.productSub !== selectedProductSub) return false;
      if (selectedProductSegment !== 'All' && t.productSegment !== selectedProductSegment) return false;
      if (searchTerm.trim() && !t.shopName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [transactions, selectedMonth, selectedShopType, selectedShopSegment, selectedProductSub, selectedProductSegment, searchTerm]);

  // --- KPI Stats ---
  const stats = useMemo(() => {
    const totalRevenue = filteredData.reduce((sum, t) => sum + t.amount, 0);
    const totalQty = filteredData.reduce((sum, t) => sum + t.qty, 0);
    const activeShops = new Set(filteredData.map((t) => t.shopName)).size;
    const productCategories = new Set(filteredData.map((t) => t.productSub)).size;
    return { totalRevenue, totalQty, activeShops, productCategories };
  }, [filteredData]);

  // --- Revenue Trend (Line Chart) ---
  const revenueTrendData = useMemo(() => {
    const byMonth = {};
    filteredData.forEach((t) => {
      byMonth[t.month] = (byMonth[t.month] || 0) + t.amount;
    });
    return MONTH_ORDER
      .filter((m) => byMonth[m] !== undefined)
      .map((m) => ({ month: m, revenue: Math.round(byMonth[m]) }));
  }, [filteredData]);

  // --- Revenue by Shop Segment (Bar Chart) ---
  const segmentData = useMemo(() => {
    const bySeg = {};
    filteredData.forEach((t) => {
      bySeg[t.shopSegment] = (bySeg[t.shopSegment] || 0) + t.amount;
    });
    return Object.entries(bySeg)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // --- Product Mix (Pie Chart) ---
  const productMixData = useMemo(() => {
    const byCat = {};
    filteredData.forEach((t) => {
      byCat[t.productSub] = (byCat[t.productSub] || 0) + t.amount;
    });
    return Object.entries(byCat)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // --- Weekend vs Weekday (Bar Chart) ---
  const weekendData = useMemo(() => {
    const groups = { Weekday: { revenue: 0, units: 0 }, Weekend: { revenue: 0, units: 0 } };
    filteredData.forEach((t) => {
      const key = t.isWeekend ? 'Weekend' : 'Weekday';
      groups[key].revenue += t.amount;
      groups[key].units += t.qty;
    });
    return Object.entries(groups).map(([name, data]) => ({
      name,
      revenue: Math.round(data.revenue),
      units: data.units
    }));
  }, [filteredData]);

  // --- Branch Performance Table ---
  const branchPerformance = useMemo(() => {
    const byShop = {};
    filteredData.forEach((t) => {
      if (!byShop[t.shopName]) {
        byShop[t.shopName] = {
          shopName: t.shopName,
          shopType: t.shopType,
          shopSegment: t.shopSegment,
          revenue: 0,
          units: 0,
          productCount: {},
          productNameCount: {}
        };
      }
      byShop[t.shopName].revenue += t.amount;
      byShop[t.shopName].units += t.qty;
      byShop[t.shopName].productCount[t.productSub] =
        (byShop[t.shopName].productCount[t.productSub] || 0) + t.qty;
      byShop[t.shopName].productNameCount[t.productName] =
        (byShop[t.shopName].productNameCount[t.productName] || 0) + t.qty;
    });

    return Object.values(byShop)
      .map((shop) => {
        const topProduct = Object.entries(shop.productCount)
          .sort((a, b) => b[1] - a[1])[0];
        const topProductName = Object.entries(shop.productNameCount)
          .sort((a, b) => b[1] - a[1])[0];
        return {
          ...shop,
          revenue: Math.round(shop.revenue),
          topProduct: topProduct ? topProduct[0] : '-',
          topProductName: topProductName ? topProductName[0] : '-'
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredData]);

  // --- UI Components ---
  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="text-white" size={24} />
        </div>
        <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">{title}</span>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );

  const FilterSelect = ({ label, value, onChange, options }) => (
    <div className="relative">
      <label className="text-[10px] font-bold text-slate-400 absolute top-2 left-3 uppercase">{label}</label>
      <select
        className="w-full pt-6 pb-2 px-3 border border-slate-200 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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

  // --- Loading / Error States ---
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-sans bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 text-lg">Loading Transaction Data...</p>
          <p className="text-slate-400 text-sm mt-1">Fetching from Google Sheets</p>
        </div>
      </div>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center font-sans bg-slate-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md">
          <AlertCircle className="text-rose-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Failed to Load Data</h2>
          <p className="text-slate-500 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => { setLoading(true); setError(null); fetchTransactions().then(setTransactions).catch((e) => setError(e.message)).finally(() => setLoading(false)); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50"
            >
              Import JSON
            </button>
          </div>
          <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleImportFile} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="text-blue-600" />
            TrueX <span className="text-blue-600">Strategic Dashboard</span>
          </h1>
          <p className="text-slate-500 mt-1">Intelligence Advisor Console | Live Google Sheets Data</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleImportFile} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50"
          >
            <Upload size={16} /> Import Data
          </button>
          <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            {transactions.length.toLocaleString()} RECORDS
          </div>
        </div>
      </header>

      {/* Filters */}
      <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
          <label className="text-[10px] font-bold text-slate-400 absolute top-2 left-3 uppercase z-10">Search Shop</label>
          <Search className="absolute left-3 top-8 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Type shop name..."
            className="w-full pt-6 pb-2 pl-8 pr-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
            onFocus={() => searchTerm.trim() && setShowSuggestions(true)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
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

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`฿${stats.totalRevenue.toLocaleString()}`}
          icon={TrendingUp}
          color="bg-blue-600"
          subtitle="Net value in selected period"
        />
        <StatCard
          title="Units Sold"
          value={`${stats.totalQty.toLocaleString()} Units`}
          icon={Package}
          color="bg-violet-600"
          subtitle="Transaction volume"
        />
        <StatCard
          title="Active Shops"
          value={stats.activeShops}
          icon={Store}
          color="bg-emerald-600"
          subtitle="Unique shops with sales"
        />
        <StatCard
          title="Product Categories"
          value={stats.productCategories}
          icon={Layers}
          color="bg-orange-600"
          subtitle="Distinct categories"
        />
      </section>

      {/* Charts Row 1: Revenue Trend + Shop Segment */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Trend Line Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            Revenue Trend
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`฿${value.toLocaleString()}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke={COLORS.blue} strokeWidth={3} dot={{ fill: COLORS.blue, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Shop Segment */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Store size={20} className="text-emerald-600" />
            Revenue by Shop Segment
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segmentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`฿${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="value" fill={COLORS.emerald} radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Charts Row 2: Product Mix + Weekend Analysis */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Product Mix Pie */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Package size={20} className="text-violet-600" />
            Product Category Mix
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productMixData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {productMixData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS.segments[idx % COLORS.segments.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`฿${value.toLocaleString()}`, 'Revenue']} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekend vs Weekday */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <CalendarDays size={20} className="text-amber-600" />
            Weekend vs Weekday
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value, name) => [name === 'revenue' ? `฿${value.toLocaleString()}` : value.toLocaleString(), name === 'revenue' ? 'Revenue' : 'Units']}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue (฿)" fill={COLORS.amber} radius={[6, 6, 0, 0]} barSize={50} />
                <Bar yAxisId="right" dataKey="units" name="Units" fill={COLORS.cyan} radius={[6, 6, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Branch Performance Table */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold">Branch Performance Ranking</h3>
          <span className="text-xs font-bold text-slate-400">{branchPerformance.length} shops</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Shop Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Segment</th>
                <th className="px-6 py-4">Revenue (THB)</th>
                <th className="px-6 py-4">Units</th>
                <th className="px-6 py-4">Top Product</th>
                <th className="px-6 py-4">Product Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {branchPerformance.map((shop, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${idx < 3 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 text-sm">{shop.shopName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${shop.shopType === 'WW' ? 'bg-indigo-50 text-indigo-600' :
                      shop.shopType.includes('สเฟียร์') ? 'bg-cyan-50 text-cyan-600' :
                        'bg-orange-50 text-orange-600'
                      }`}>
                      {shop.shopType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${shop.shopSegment === 'Champion' ? 'bg-emerald-50 text-emerald-700' :
                      shop.shopSegment === 'High Potential' ? 'bg-blue-50 text-blue-700' :
                        shop.shopSegment === 'At Risk' ? 'bg-rose-50 text-rose-700' :
                          shop.shopSegment === 'Event' ? 'bg-violet-50 text-violet-700' :
                            'bg-slate-100 text-slate-600'
                      }`}>
                      {shop.shopSegment}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-700">
                    ฿{shop.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${stats.totalQty > 0 ? Math.min(100, (shop.units / stats.totalQty) * 500) : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-slate-500">{shop.units}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">
                      {shop.topProduct}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium">
                      {shop.topProductName}
                    </span>
                  </td>
                </tr>
              ))}
              {branchPerformance.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    No data found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-8 bg-slate-800 text-slate-300 p-6 rounded-2xl border-l-4 border-blue-500">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <AlertCircle className="text-blue-400" />
          </div>
          <div>
            <h4 className="text-white font-bold mb-1 underline decoration-blue-500 underline-offset-4">Strategic Advisor Insight:</h4>
            <p className="text-sm leading-relaxed">
              Based on <strong>{filteredData.length.toLocaleString()}</strong> transactions across <strong>{stats.activeShops}</strong> shops,
              total revenue stands at <strong>฿{stats.totalRevenue.toLocaleString()}</strong> with <strong>{stats.totalQty.toLocaleString()}</strong> units sold.
              {stats.productCategories > 0 && ` Products span ${stats.productCategories} categories.`}
              {' '}Focus on <strong>high-performing segments</strong> and consider targeted incentives for underperforming branches.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;