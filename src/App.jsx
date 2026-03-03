import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Upload, Package, Store, AlertCircle, Sun, Moon } from 'lucide-react';
import { fetchTransactions } from './data/fetchTransactions';
import FilterBar from './components/FilterBar';
import DashboardSkeleton from './components/DashboardSkeleton';
import ProductView from './views/ProductView';
import ShopView from './views/ShopView';

const MONTH_ORDER = [
  'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25',
  'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25', 'Jan-26', 'Feb-26'
];

const App = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('shop');
  const [startMonth, setStartMonth] = useState('All');
  const [endMonth, setEndMonth] = useState('All');
  const fileInputRef = useRef(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

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

  const months = useMemo(() => {
    const unique = [...new Set(transactions.map(t => t.month).filter(Boolean))];
    return unique.sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));
  }, [transactions]);

  const filteredData = useMemo(() => {
    if (startMonth === 'All' && endMonth === 'All') return transactions;
    const startIdx = startMonth === 'All' ? 0 : MONTH_ORDER.indexOf(startMonth);
    const endIdx = endMonth === 'All' ? MONTH_ORDER.length - 1 : MONTH_ORDER.indexOf(endMonth);
    const rangeMonths = MONTH_ORDER.slice(Math.max(startIdx, 0), endIdx + 1);
    return transactions.filter(t => rangeMonths.includes(t.month));
  }, [transactions, startMonth, endMonth]);

  const allShopCount = useMemo(() => {
    const pairs = new Set(transactions.map(t => `${t.shopType}|||${t.shopName}`));
    return pairs.size;
  }, [transactions]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error && transactions.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center font-sans bg-white">
        <div className="text-center bg-white p-10 rounded-2xl shadow-lg border border-slate-200 max-w-md">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Failed to Load Data</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setLoading(true); setError(null); fetchTransactions().then(setTransactions).catch(e => setError(e.message)).finally(() => setLoading(false)); }} className="px-5 py-2.5 bg-gradient-to-r from-pink-600 via-red-500 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all">
              Retry
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all">
              Import JSON
            </button>
          </div>
          <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleImportFile} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo + Title */}
            <div className="flex items-center gap-2.5">
              <img src="/truex-logo.png" alt="TrueX" className="w-8 h-8 rounded-lg object-cover" />
              <h1 className="text-base font-bold text-slate-800 tracking-tight">True Shop Dashboard</h1>
            </div>

            {/* View Tabs */}
            <nav className="flex items-center border border-slate-200 rounded-lg p-0.5">
              <button
                onClick={() => setActiveView('shop')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${activeView === 'shop' ? 'bg-gradient-to-r from-pink-600 via-red-500 to-orange-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Store size={14} />
                Shop
              </button>
              <button
                onClick={() => setActiveView('product')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${activeView === 'product' ? 'bg-gradient-to-r from-pink-600 via-red-500 to-orange-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Package size={14} />
                Product
              </button>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all"
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {darkMode ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-500" />}
              </button>
              <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleImportFile} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all"
              >
                <Upload size={13} /> Import
              </button>
              <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                {transactions.length.toLocaleString()} RECORDS
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-5">
        <div className="mb-5">
          <FilterBar
            startMonth={startMonth}
            setStartMonth={setStartMonth}
            endMonth={endMonth}
            setEndMonth={setEndMonth}
            months={months}
          />
        </div>

        {activeView === 'shop' ? (
          <ShopView filteredData={filteredData} allTransactions={transactions} startMonth={startMonth} endMonth={endMonth} />
        ) : (
          <ProductView filteredData={filteredData} />
        )}

        {/* Footer */}
        <footer className="mt-6 bg-white text-slate-500 p-4 rounded-xl border border-slate-200" style={{ borderLeft: '4px solid #e8222b' }}>
          <div className="flex items-start gap-3">
            <AlertCircle className="text-pink-500 shrink-0" size={16} />
            <p className="text-xs leading-relaxed">
              Showing <strong className="text-slate-700">{filteredData.length.toLocaleString()}</strong> transactions.
              Use the view-specific filters to drill down into details. Select a time period to filter globally.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;