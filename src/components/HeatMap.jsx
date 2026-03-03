import React, { useMemo } from 'react';

const HeatMap = ({ data, rowKey = 'name', months = [], title = 'Revenue Heat Map' }) => {
    const { minVal, maxVal } = useMemo(() => {
        let min = Infinity, max = -Infinity;
        data.forEach(row => {
            months.forEach(m => {
                const v = row[m] || 0;
                if (v > 0 && v < min) min = v;
                if (v > max) max = v;
            });
        });
        if (min === Infinity) min = 0;
        return { minVal: min, maxVal: max };
    }, [data, months]);

    const getCellColor = (value) => {
        if (!value || value === 0) return 'bg-slate-50 text-slate-300';
        const ratio = maxVal > minVal ? (value - minVal) / (maxVal - minVal) : 0;
        if (ratio > 0.8) return 'bg-orange-500 text-white';
        if (ratio > 0.6) return 'bg-red-500 text-white';
        if (ratio > 0.4) return 'bg-pink-400 text-white';
        if (ratio > 0.2) return 'bg-pink-200 text-pink-800';
        return 'bg-pink-100 text-pink-700';
    };

    const formatValue = (v) => {
        if (!v || v === 0) return '—';
        if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
        if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
        return v.toLocaleString();
    };

    if (data.length === 0 || months.length === 0) {
        return (
            <div className="chart-card">
                <h3 className="text-sm font-bold mb-4 text-slate-700">{title}</h3>
                <p className="text-sm text-slate-400 text-center py-8">No data available for heat map.</p>
            </div>
        );
    }

    return (
        <div className="chart-card overflow-hidden">
            <h3 className="text-sm font-bold mb-4 text-slate-700">{title}</h3>
            <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                            <th className="pb-2 pr-2 text-left sticky left-0 bg-white z-10 min-w-[80px] sm:min-w-[120px]">Shop</th>
                            {months.map(m => (
                                <th key={m} className="pb-2 px-1 text-center min-w-[42px] sm:min-w-[52px]">{m.replace('-25', '').replace('-26', "'26")}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr key={idx}>
                                <td className="py-1 pr-2 font-semibold text-slate-600 truncate max-w-[80px] sm:max-w-[120px] sticky left-0 bg-white z-10 text-[10px] sm:text-xs">
                                    {row[rowKey]}
                                </td>
                                {months.map(m => (
                                    <td key={m} className="py-1 px-1">
                                        <div
                                            className={`rounded px-1 py-1.5 text-center text-[10px] font-bold transition-all ${getCellColor(row[m])}`}
                                            title={`${row[rowKey]} — ${m}: ฿${(row[m] || 0).toLocaleString()}`}
                                        >
                                            {formatValue(row[m])}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex items-center gap-2 mt-3 justify-end">
                <span className="text-[10px] text-slate-400">Low</span>
                <div className="flex gap-0.5">
                    {['bg-pink-100', 'bg-pink-200', 'bg-pink-400', 'bg-red-500', 'bg-orange-500'].map((c, i) => (
                        <div key={i} className={`w-4 h-3 rounded-sm ${c}`} />
                    ))}
                </div>
                <span className="text-[10px] text-slate-400">High</span>
            </div>
        </div>
    );
};

export default HeatMap;
