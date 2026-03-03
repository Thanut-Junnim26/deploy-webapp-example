import React, { useEffect, useRef, useState } from 'react';

const AnimatedNumber = ({ value, prefix = '', suffix = '' }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const num = typeof value === 'number' ? value : parseInt(value, 10) || 0;
    const duration = 800;
    const start = performance.now();
    const startVal = display;

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startVal + (num - startVal) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
};

const MoMBadge = ({ value, label = 'MoM' }) => {
  if (value === null || value === undefined) return null;
  if (value === 'single') return (
    <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 bg-slate-50 rounded">Single period</span>
  );
  const isPositive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
      {isPositive ? '▲' : '▼'} {Math.abs(value).toFixed(1)}% <span className="opacity-60">{label}</span>
    </span>
  );
};

const StatCard = ({ title, value, numericValue, icon: Icon, gradient, subtitle, mom, yoy, statusBadge }) => (
  <div className="stat-card group">
    <div className="flex justify-between items-start mb-2 sm:mb-3">
      <div className={`p-2 sm:p-2.5 rounded-lg bg-gradient-to-br ${gradient}`}>
        <Icon className="text-white" size={16} />
      </div>
      <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{title}</span>
    </div>
    <div>
      <h3 className="text-lg sm:text-2xl font-extrabold text-slate-800">
        {numericValue !== undefined ? (
          <AnimatedNumber
            value={numericValue}
            prefix={typeof value === 'string' && value.startsWith('฿') ? '฿' : ''}
            suffix={typeof value === 'string' && value.includes('Units') ? ' Units' : ''}
          />
        ) : value}
      </h3>
      {statusBadge && (
        <div className="mt-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusBadge.color}`}>
            {statusBadge.label}
          </span>
        </div>
      )}
      <p className="text-[10px] sm:text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>
      {(mom !== undefined || yoy !== undefined) && (
        <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 flex-wrap">
          {mom !== undefined && <MoMBadge value={mom} label="MoM" />}
          {yoy !== undefined && <MoMBadge value={yoy} label="YoY" />}
        </div>
      )}
    </div>
  </div>
);

export { AnimatedNumber, MoMBadge };
export default StatCard;
