import React from 'react';

const ChartCard = ({ title, icon: Icon, iconColor, children, className = '' }) => (
    <div className={`chart-card ${className}`}>
        <h3 className="text-base font-bold mb-5 flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${iconColor}`}>
                <Icon size={16} className="text-white" />
            </div>
            <span className="text-slate-700">{title}</span>
        </h3>
        {children}
    </div>
);

export default ChartCard;
