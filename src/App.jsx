import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  LayoutDashboard,
  Store,
  Package,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Filter,
  Upload,
  Search,
  ChevronDown
} from 'lucide-react';

// --- Configuration & Constants ---
const COLORS = {
  active: '#10b981', // Emerald 500
  inactive: '#ef4444', // Red 500
  primary: '#3b82f6', // Blue 500
  secondary: '#8b5cf6', // Violet 500
  branding: '#f97316', // Orange 500
  ww: '#6366f1', // Indigo 500
  segments: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
};

const App = () => {
  // --- Data State ---
  const [transactions, setTransactions] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Filter State ---
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedShopType, setSelectedShopType] = useState('All');
  const [selectedShopSegment, setSelectedShopSegment] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // --- File Import ---
  const fileInputRef = useRef(null);
  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data)) {
          setTransactions(data);
          alert(`Imported ${data.length} transactions successfully!`);
        } else {
          alert('Invalid format: expected a JSON array of transactions.');
        }
      } catch (err) {
        alert('Failed to parse file. Please upload a valid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset so the same file can be re-imported
  };

  // --- Mock Data Initialization ---
  useEffect(() => {
    const mockShops = [
      { id: '80000141', name: 'Siam Paragon', type: 'True Branding', segment: 'Mass' },
      { id: '80000124', name: 'True Tower 1', type: 'True Branding', segment: 'Event' },
      { id: '80101263', name: 'WW Maya Chiang Mai', type: 'WW', segment: 'Champion' },
      { id: '80101186', name: 'WW Central Festival Eastville', type: 'WW', segment: 'Champion' },
      { id: '80101000', name: 'Terminal 21', type: 'WW', segment: 'Mass' },
      { id: '80101001', name: 'Lotus Ranong', type: 'WW', segment: 'At Risk' },
      { id: '80000200', name: 'Icon Siam', type: 'True Branding', segment: 'Mass' },
      { id: '80000300', name: 'EmQuartier', type: 'True Sphere', segment: 'Champion' }
    ];

    const mockTransactions = [
      { date: '2025-01-15', shopId: '80101263', amount: 1999, qty: 1, product: 'Air Purifier', month: 'Jan-25' },
      { date: '2025-01-20', shopId: '80101186', amount: 1999, qty: 1, product: 'Air Purifier', month: 'Jan-25' },
      { date: '2025-02-05', shopId: '80000141', amount: 288.9, qty: 1, product: 'Weight Scale V2', month: 'Feb-26' },
      { date: '2025-02-06', shopId: '80000124', amount: 288.9, qty: 1, product: 'Weight Scale V2', month: 'Feb-26' },
      { date: '2025-02-10', shopId: '80101263', amount: 5000, qty: 2, product: 'Smart Camera', month: 'Feb-26' },
    ];

    setShops(mockShops);
    setTransactions(mockTransactions);
    setLoading(false);
  }, []);

  // --- Analytical Calculations ---
  const filteredData = useMemo(() => {
    let result = transactions;
    if (selectedMonth !== 'All') result = result.filter(t => t.month === selectedMonth);

    return result.filter(t => {
      const shop = shops.find(s => s.id === t.shopId);
      if (!shop) return false;
      const typeMatch = selectedShopType === 'All' || shop.type === selectedShopType;
      const segmentMatch = selectedShopSegment === 'All' || shop.segment === selectedShopSegment;
      return typeMatch && segmentMatch;
    });
  }, [transactions, shops, selectedMonth, selectedShopType, selectedShopSegment]);

  const shopPerformance = useMemo(() => {
    return shops.map(shop => {
      const shopTrans = filteredData.filter(t => t.shopId === shop.id);
      const totalRevenue = shopTrans.reduce((sum, t) => sum + t.amount, 0);
      const totalQty = shopTrans.reduce((sum, t) => sum + t.qty, 0);
      return {
        ...shop,
        revenue: totalRevenue,
        qty: totalQty,
        isActive: shopTrans.length > 0,
        lastActive: shopTrans.length > 0 ? shopTrans[shopTrans.length - 1].date : 'N/A'
      };
    }).filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedShopType === 'All' || s.type === selectedShopType;
      const matchesSegment = selectedShopSegment === 'All' || s.segment === selectedShopSegment;
      return matchesSearch && matchesType && matchesSegment;
    });
  }, [shops, filteredData, searchTerm, selectedShopType, selectedShopSegment]);

  const stats = useMemo(() => {
    const activeShops = shopPerformance.filter(s => s.isActive).length;
    const totalRevenue = filteredData.reduce((sum, t) => sum + t.amount, 0);
    const totalQty = filteredData.reduce((sum, t) => sum + t.qty, 0);
    return {
      totalRevenue,
      totalQty,
      activeShops,
      inactiveShops: shopPerformance.length - activeShops,
      activeRate: shopPerformance.length > 0 ? ((activeShops / shopPerformance.length) * 100).toFixed(1) : 0
    };
  }, [shopPerformance, filteredData]);

  const chartData = useMemo(() => {
    const revenueBySegment = {};
    shopPerformance.forEach(s => {
      revenueBySegment[s.segment] = (revenueBySegment[s.segment] || 0) + s.revenue;
    });
    return Object.entries(revenueBySegment).map(([name, value]) => ({ name, value }));
  }, [shopPerformance]);

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

  if (loading) return <div className="flex h-screen items-center justify-center font-sans">Loading Strategic Intelligence...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="text-blue-600" />
            TrueX <span className="text-blue-600">Strategic Dashboard</span>
          </h1>
          <p className="text-slate-500 mt-1">Intelligence Advisor Console | Real-time Transaction Analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50"
          >
            <Upload size={16} /> Import Data
          </button>
          <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            LIVE DATA SOURCE
          </div>
        </div>
      </header>

      {/* Control Bar (Filters) */}
      <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <label className="text-[10px] font-bold text-slate-400 absolute top-2 left-3 uppercase">Time Period</label>
          <select
            className="w-full pt-6 pb-2 px-3 border border-slate-200 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="All">Overall Horizon</option>
            <option value="Jan-25">January 2025</option>
            <option value="Feb-26">February 2026</option>
          </select>
          <ChevronDown className="absolute right-3 top-7 text-slate-400 pointer-events-none" size={16} />
        </div>

        <div className="relative">
          <label className="text-[10px] font-bold text-slate-400 absolute top-2 left-3 uppercase">Channel / Shop Type</label>
          <select
            className="w-full pt-6 pb-2 px-3 border border-slate-200 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedShopType}
            onChange={(e) => setSelectedShopType(e.target.value)}
          >
            <option value="All">All Channels</option>
            <option value="True Sphere">True Sphere</option>
            <option value="True Branding">True Branding</option>
            <option value="WW">Wire & Wireless (WW)</option>
          </select>
          <ChevronDown className="absolute right-3 top-7 text-slate-400 pointer-events-none" size={16} />
        </div>

        <div className="relative">
          <label className="text-[10px] font-bold text-slate-400 absolute top-2 left-3 uppercase">Strategic Segment</label>
          <select
            className="w-full pt-6 pb-2 px-3 border border-slate-200 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedShopSegment}
            onChange={(e) => setSelectedShopSegment(e.target.value)}
          >
            <option value="All">All Segments</option>
            <option value="Champion">Champion (High Performance)</option>
            <option value="Mass">Mass Market</option>
            <option value="Event">Event Based</option>
            <option value="At Risk">At Risk / Need Support</option>
          </select>
          <ChevronDown className="absolute right-3 top-7 text-slate-400 pointer-events-none" size={16} />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search Branch Name..."
            className="w-full py-4 pl-10 pr-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      {/* KPI Overview */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`฿${stats.totalRevenue.toLocaleString()}`}
          icon={TrendingUp}
          color="bg-blue-600"
          subtitle="Net value in selected period"
        />
        <StatCard
          title="Product Sold"
          value={`${stats.totalQty.toLocaleString()} Units`}
          icon={Package}
          color="bg-violet-600"
          subtitle="Transaction volume"
        />
        <StatCard
          title="Active Shops"
          value={`${stats.activeShops}`}
          icon={CheckCircle2}
          color="bg-emerald-600"
          subtitle={`${stats.activeRate}% Contribution Rate`}
        />
        <StatCard
          title="Inactive Shops"
          value={`${stats.inactiveShops}`}
          icon={AlertCircle}
          color="bg-rose-600"
          subtitle="Shops with 0 transactions"
        />
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Store size={20} className="text-blue-600" />
            Revenue by Shop Segment
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <AlertCircle size={20} className="text-rose-600" />
            Shop Activity Ratio
          </h3>
          <div className="h-[300px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Active', value: stats.activeShops },
                    { name: 'Inactive', value: stats.inactiveShops }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill={COLORS.active} />
                  <Cell fill={COLORS.inactive} />
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-4 pr-8">
              <div className="text-center">
                <span className="text-3xl font-bold text-emerald-600">{stats.activeRate}%</span>
                <p className="text-xs text-slate-500 uppercase font-bold">Health Score</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Shop List Table */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold">Branch Operational Intel</h3>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md">
              <CheckCircle2 size={12} /> Active
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-rose-100 text-rose-700 rounded-md">
              <AlertCircle size={12} /> Inactive
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Shop Name</th>
                <th className="px-6 py-4">Channel</th>
                <th className="px-6 py-4">Segment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Revenue (THB)</th>
                <th className="px-6 py-4">Units</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shopPerformance.map((shop, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{shop.name}</div>
                    <div className="text-xs text-slate-400">ID: {shop.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${shop.type.includes('WW') ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                      {shop.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 font-medium">{shop.segment}</span>
                  </td>
                  <td className="px-6 py-4">
                    {shop.isActive ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-rose-500 text-sm font-bold">
                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-700">
                    ฿{shop.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full"
                        style={{ width: `${stats.totalQty > 0 ? Math.min(100, (shop.qty / stats.totalQty) * 1000) : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{shop.qty} pcs</span>
                  </td>
                </tr>
              ))}
              {shopPerformance.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    No data found matching current filters. Try adjusting your scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Strategic Advisor Note */}
      <footer className="mt-8 bg-slate-800 text-slate-300 p-6 rounded-2xl border-l-4 border-blue-500">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <AlertCircle className="text-blue-400" />
          </div>
          <div>
            <h4 className="text-white font-bold mb-1 underline decoration-blue-500 underline-offset-4">Strategic Advisor Insight:</h4>
            <p className="text-sm leading-relaxed">
              We are currently seeing a <strong>{(100 - parseFloat(stats.activeRate)).toFixed(1)}% Inactivity Rate</strong>.
              The <strong>Second-order thinking</strong> suggests this might be due to inventory latency or specific training gaps in WW branches compared to True Branding.
              We should prioritize <strong>Targeted Incentives</strong> for 'At Risk' segments to boost <strong>Market Penetration</strong>.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;