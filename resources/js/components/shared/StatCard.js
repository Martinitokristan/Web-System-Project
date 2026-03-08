import React from 'react';

export default function StatCard({ label, value, trend, trendUp, icon, accentColor = 'accent' }) {
    return (
        <div className={`stat-card stat-card--${accentColor}`}>
            {icon && (
                <div className={`stat-card__icon`} style={{ background: `var(--${accentColor}-light)`, color: `var(--${accentColor})` }}>
                    {icon}
                </div>
            )}
            <div className="stat-card__label">{label}</div>
            <div className="stat-card__value">{value}</div>
            {trend !== undefined && (
                <div className={`stat-card__trend ${trendUp ? 'up' : 'down'}`}>
                    {trendUp ? '↑' : '↓'} {trend}
                </div>
            )}
        </div>
    );
}
