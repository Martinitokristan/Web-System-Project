import React from 'react';

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md', hideFooter = false }) {
    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={`modal modal--${size}`}>
                <div className="modal__header">
                    <h2>{title}</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>
                <div className="modal__body">
                    {children}
                </div>
                {footer && (
                    <div className="modal__footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
