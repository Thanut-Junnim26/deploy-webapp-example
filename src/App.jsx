import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LayoutDashboard, Upload, Package, Store, AlertCircle } from 'lucide-react';
import { fetchTransactions } from './data/fetchTransactions';
import FilterBar from './components/FilterBar';
import ActiveFilters from './components/ActiveFilters';
import ProductView from './views/ProductView';
import BranchView from './views/BranchView';

const MONTH_ORDER = [
  'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25',
  'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25', 'Jan-26', 'Feb-26'
];

const App = () => {
  // --- Data ---
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- View ---
  const [activeView, setActiveView] = useState('product');

  // --- Filters ---
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedShopType, setSelectedShopType] = useState('All');
  const [selectedShopSegment, setSelectedShopSegment] = useState('All');
  const [selectedProductSub, setSelectedProductSub] = useState('All');
  const [selectedProductSegment, setSelectedProductSegment] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // --- Cross-filtering ---
  const [chartFilter, setChartFilter] = useState(null);

  const fileInputRef = useRef(null);

  // --- Fetch data ---
  useEffect(() => {
    fetchTransactions()
      .then((data) => { setTransactions(data); setLoading(false); })
      .catch((err) => { console.error('Failed to fetch:', err); setError(err.message); setLoading(false); });
  }, []);

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data)) { setTransactions(data); setError(null); }
        else alert('Invalid format: expected JSON array.');
      } catch { alert('Failed to parse file.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- Distinct values ---
  const distinctValues = useMemo(() => {
    const unique = (key) => [...new Set(transactions.map(t => t[key]).filter(Boolean))];
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

  // --- Filtered data (dropdown filters + chart cross-filter) ---
  const filteredData = useMemo(() => {
    return transactions.filter(t => {
      if (selectedMonth !== 'All' && t.month !== selectedMonth) return false;
      if (selectedShopType !== 'All' && t.shopType !== selectedShopType) return false;
      if (selectedShopSegment !== 'All' && t.shopSegment !== selectedShopSegment) return false;
      if (selectedProductSub !== 'All' && t.productSub !== selectedProductSub) return false;
      if (selectedProductSegment !== 'All' && t.productSegment !== selectedProductSegment) return false;
      if (searchTerm.trim() && !t.shopName.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      // Cross-filter from chart click
      if (chartFilter) {
        switch (chartFilter.type) {
          case 'shopSegment': if (t.shopSegment !== chartFilter.value) return false; break;
          case 'productSub': if (t.productSub !== chartFilter.value) return false; break;
          case 'productSegment': if (t.productSegment !== chartFilter.value) return false; break;
          case 'shopName': if (t.shopName !== chartFilter.value) return false; break;
          case 'productName': if (t.productName !== chartFilter.value) return false; break;
          case 'isWeekend':
            const isWeekend = chartFilter.value === 'Weekend';
            if (t.isWeekend !== isWeekend) return false;
            break;
        }
      }

      return true;
    });
  }, [transactions, selectedMonth, selectedShopType, selectedShopSegment, selectedProductSub, selectedProductSegment, searchTerm, chartFilter]);

  // --- Loading ---
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-sans bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-5"></div>
          <p className="text-slate-600 text-lg font-semibold">Loading Transaction Data...</p>
          <p className="text-slate-400 text-sm mt-1">Fetching from Google Sheets</p>
        </div>
      </div>
    );
  }

  // --- Error ---
  if (error && transactions.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center font-sans bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center bg-white/70 backdrop-blur-md p-10 rounded-2xl shadow-xl border border-slate-200/50 max-w-md">
          <AlertCircle className="text-rose-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Failed to Load Data</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setLoading(true); setError(null); fetchTransactions().then(setTransactions).catch(e => setError(e.message)).finally(() => setLoading(false)); }} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all">
              Retry
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all">
              Import JSON
            </button>
          </div>
          <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleImportFile} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 text-slate-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                <LayoutDashboard className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900">TrueX</h1>
                <p className="text-[10px] text-slate-400 font-medium -mt-0.5">Strategic Dashboard</p>
              </div>
            </div>

            {/* View Tabs */}
            <nav className="flex items-center bg-slate-100/80 rounded-xl p-1">
              <button
                onClick={() => { setActiveView('product'); setChartFilter(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${activeView === 'product' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Package size={16} />
                Product
              </button>
              <button
                onClick={() => { setActiveView('branch'); setChartFilter(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${activeView === 'branch' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Store size={16} />
                Branch
              </button>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleImportFile} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 hover:shadow-sm transition-all"
              >
                <Upload size={14} /> Import
              </button>
              <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 border border-emerald-200/50">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                {transactions.length.toLocaleString()} RECORDS
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-6">
        {/* Filters + Active filter pill */}
        <div className="mb-6 space-y-3">
          <FilterBar
            selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
            selectedShopType={selectedShopType} setSelectedShopType={setSelectedShopType}
            selectedShopSegment={selectedShopSegment} setSelectedShopSegment={setSelectedShopSegment}
            selectedProductSub={selectedProductSub} setSelectedProductSub={setSelectedProductSub}
            selectedProductSegment={selectedProductSegment} setSelectedProductSegment={setSelectedProductSegment}
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            distinctValues={distinctValues}
          />
          <ActiveFilters chartFilter={chartFilter} onClear={() => setChartFilter(null)} />
        </div>

        {/* View Content */}
        {activeView === 'product' ? (
          <ProductView filteredData={filteredData} chartFilter={chartFilter} onChartFilter={setChartFilter} />
        ) : (
          <BranchView filteredData={filteredData} chartFilter={chartFilter} onChartFilter={setChartFilter} />
        )}

        {/* Footer */}
        <footer className="mt-8 bg-gradient-to-r from-slate-800 to-slate-900 text-slate-300 p-5 rounded-2xl border-l-4 border-blue-500">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
              <AlertCircle className="text-blue-400" size={18} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-1">Strategic Insight</h4>
              <p className="text-xs leading-relaxed text-slate-400">
                Showing <strong className="text-slate-200">{filteredData.length.toLocaleString()}</strong> transactions.
                Click any chart element to cross-filter the entire dashboard. Use the ✕ button to clear chart filters.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;