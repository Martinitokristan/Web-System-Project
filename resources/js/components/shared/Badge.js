import React from 'react';

export default function Badge({ text, variant = 'gray' }) {
    const displayText = text ? String(text).replace(/_/g, ' ') : '';
    return (
        <span className={`badge badge--${String(variant).toLowerCase().replace(/ /g, '_')}`}>
            {displayText}
        </span>
    );
}

// Auto-detect variant from status string
export function StatusBadge({ status }) {
    return <Badge text={status} variant={status} />;
}

export function RoleBadge({ role }) {
    return <Badge text={role} variant={role} />;
}
