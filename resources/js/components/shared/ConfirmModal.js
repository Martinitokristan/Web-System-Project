import React from 'react';
import Modal from './Modal';

export default function ConfirmModal({ isOpen, message, onConfirm, onCancel, title = "Confirm Action" }) {
    return (
        <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
            <div className="confirm-modal">
                <div className="confirm-icon">!</div>
                <h3>Are you sure?</h3>
                <p>{message}</p>
            </div>
            <div className="d-flex justify-between mt-auto pt-4 border-top">
                <button className="btn btn--ghost" onClick={onCancel}>Cancel</button>
                <button className="btn btn--danger" onClick={onConfirm}>Confirm Delete</button>
            </div>
        </Modal>
    );
}
