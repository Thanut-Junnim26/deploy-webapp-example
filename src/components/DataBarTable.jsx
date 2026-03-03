import React from 'react';
import { Award } from 'lucide-react';

const MoMBadge = ({ value }) => {
    if (value === null || value === undefined) return <span className="text-[10px] text-slate-400">—</span>;
    const isPositive = value >= 0;
    return (
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {isPositive ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
        </span>
    );
};

const DataBarTable = ({ title, data, columns = ['name', 'revenue'], showMoM = true, icon: Icon = Award, iconGradient = 'from-pink-600 via-red-500 to-orange-500', maxItems = 10 }) => {
    const items = data.slice(0, maxItems);
    const maxRevenue = items.length > 0 ? items[0].revenue : 1;

    return (
        <div className="chart-card overflow-hidden">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${iconGradient}`}>
                    <Icon size={14} className="text-white" />
                </div>
                <span className="text-slate-700">{title}</span>
                <span className="ml-auto text-[10px] text-slate-400 font-normal">{items.length} items</span>
            </h3>
            <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                            <th className="pb-2.5 pr-3 w-8">#</th>
                            <th className="pb-2.5 pr-3">Name</th>
                            <th className="pb-2.5 pr-3 text-right">Revenue</th>
                            <th className="pb-2.5 pr-3 text-right">Units</th>
                            {showMoM && <th className="pb-2.5 pr-3 text-right">MoM</th>}
                            <th className="pb-2.5 w-28"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-pink-50/40 transition-colors">
                                <td className="py-2 pr-3">
                                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${idx < 3 ? 'bg-gradient-to-r from-pink-100 to-orange-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {idx + 1}
                                    </span>
                                </td>
                                <td className="py-2 pr-3 font-semibold text-slate-700 text-xs max-w-[180px] truncate">
                                    {item.name}
                                    {item.subtitle && <span className="block text-[10px] text-slate-400 font-normal">{item.subtitle}</span>}
                                </td>
                                <td className="py-2 pr-3 text-right font-mono text-xs font-bold text-slate-700">
                                    ฿{Math.round(item.revenue).toLocaleString()}
                                </td>
                                <td className="py-2 pr-3 text-right text-xs text-slate-500">
                                    {(item.units || 0).toLocaleString()}
                                </td>
                                {showMoM && (
                                    <td className="py-2 pr-3 text-right">
                                        <MoMBadge value={item.mom} />
                                    </td>
                                )}
                                <td className="py-2">
                                    <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-pink-500 via-red-500 to-orange-400 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={showMoM ? 6 : 5} className="px-6 py-12 text-center text-slate-400">
                                    No data available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataBarTable;
