import React from 'react';

export default function FilterBar({ search, onSearchChange, filters = [] }) {
    return (
        <div className="filter-bar">
            {search !== undefined && (
                <div className="search-wrap">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            )}
            
            {filters.map((filter, index) => (
                <select
                    key={index}
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                >
                    {filter.options.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            ))}
        </div>
    );
}
