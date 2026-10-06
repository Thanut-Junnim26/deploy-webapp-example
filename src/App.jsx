import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Upload, Package, Store, AlertCircle, Sun, Moon, Database } from 'lucide-react';
import { fetchSheet, toTransactions } from './data/fetchTransactions';
import FilterBar from './components/FilterBar';
import DashboardSkeleton from './components/DashboardSkeleton';
import ProductView from './views/ProductView';
import ShopView from './views/ShopView';
import DataView from './views/DataView';
import { monthKey, byMonth } from './utils/months';

const App = () => {
  const [sheet, setSheet] = useState({ headers: [], rows: [], autoCols: [], source: 'csv' });
  const [imported, setImported] = useState(null); // transactions from an imported JSON file
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
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

  const loadSheet = () => fetchSheet().then((data) => { setSheet(data); setImported(null); setError(null); });

  useEffect(() => {
    loadSheet()
      .catch((err) => { console.error('Failed to fetch:', err); setError(err.message); })
      .finally(() => setLoading(false));
  }, []);

  const reload = () => {
    setReloading(true);
    loadSheet().catch((err) => setError(err.message)).finally(() => setReloading(false));
  };

  const setRows = (updater) => setSheet((s) => ({ ...s, rows: typeof updater === 'function' ? updater(s.rows) : updater }));

  const transactions = useMemo(
    () => imported ?? toTransactions(sheet.headers, sheet.rows),
    [imported, sheet.headers, sheet.rows]
  );

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data)) { setImported(data); setError(null); }
        else alert('Invalid format: expected JSON array.');
      } catch { alert('Failed to parse file.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const months = useMemo(() => {
    const unique = [...new Set(transactions.map(t => t.month).filter(Boolean))];
    return unique.sort(byMonth);
  }, [transactions]);

  const filteredData = useMemo(() => {
    if (startMonth === 'All' && endMonth === 'All') return transactions;
    const from = startMonth === 'All' ? -Infinity : monthKey(startMonth);
    const to = endMonth === 'All' ? Infinity : monthKey(endMonth);
    return transactions.filter(t => { const k = monthKey(t.month); return k >= from && k <= to; });
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
            <button onClick={() => { setLoading(true); setError(null); loadSheet().catch(e => setError(e.message)).finally(() => setLoading(false)); }} className="px-5 py-2.5 bg-gradient-to-r from-pink-600 via-red-500 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all">
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
        <div className="max-w-[1440px] mx-auto px-3 sm:px-4 md:px-8">
          <div className="flex items-center justify-between h-12 sm:h-14 gap-2">
            {/* Logo + Title */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <img src={`${import.meta.env.BASE_URL}truex-logo.png`} alt="TrueX" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover" />
              <h1 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight hidden xs:block">True Shop Dashboard</h1>
              <h1 className="text-sm font-bold text-slate-800 tracking-tight xs:hidden">Dashboard</h1>
            </div>

            {/* View Tabs */}
            <nav className="flex items-center border border-slate-200 rounded-lg p-0.5">
              <button
                onClick={() => setActiveView('shop')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 ${activeView === 'shop' ? 'bg-gradient-to-r from-pink-600 via-red-500 to-orange-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Store size={14} />
                Shop
              </button>
              <button
                onClick={() => setActiveView('product')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 ${activeView === 'product' ? 'bg-gradient-to-r from-pink-600 via-red-500 to-orange-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Package size={14} />
                Product
              </button>
              <button
                onClick={() => setActiveView('data')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 ${activeView === 'data' ? 'bg-gradient-to-r from-pink-600 via-red-500 to-orange-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Database size={14} />
                Data
              </button>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1.5 sm:gap-3">
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
                className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all"
              >
                <Upload size={13} /><span className="hidden sm:inline">Import</span>
              </button>
              <div className="hidden sm:flex bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-[10px] font-bold items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                {transactions.length.toLocaleString()} RECORDS
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1440px] mx-auto px-3 sm:px-4 md:px-8 py-3 sm:py-5">
        {activeView === 'data' ? (
          <DataView sheet={sheet} setRows={setRows} onReload={reload} reloading={reloading} />
        ) : (<>
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
        </>)}

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