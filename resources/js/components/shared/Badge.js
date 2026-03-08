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
    const variantMap = {
        'draft': 'gray',
        'pending': 'yellow',
        'approved': 'blue',
        'supplier_delivered': 'orange',
        'received': 'green',
        'active': 'green',
        'inactive': 'gray',
        'low_stock': 'red'
    };
    
    const variant = variantMap[status] || 'gray';
    return <Badge text={status} variant={variant} />;
}

export function RoleBadge({ role }) {
    return <Badge text={role} variant={role} />;
}
