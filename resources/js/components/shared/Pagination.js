import React from 'react';

export default function Pagination({ total, perPage = 15, page, onChange }) {
    const totalPages = Math.ceil(total / perPage);
    if (totalPages <= 1) return null;

    const renderButtons = () => {
        let buttons = [];
        let startPage = Math.max(1, page - 2);
        let endPage = Math.min(totalPages, page + 2);

        if (page <= 3) {
            endPage = Math.min(5, totalPages);
        }
        if (page >= totalPages - 2) {
            startPage = Math.max(1, totalPages - 4);
        }

        if (startPage > 1) {
            buttons.push(
                <button key="1" className="pagination__btn" onClick={() => onChange(1)}>1</button>
            );
            if (startPage > 2) {
                buttons.push(<span key="ellipsis1" style={{color: 'var(--text3)'}}>...</span>);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    className={`pagination__btn ${page === i ? 'active' : ''}`}
                    onClick={() => onChange(i)}
                >
                    {i}
                </button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                buttons.push(<span key="ellipsis2" style={{color: 'var(--text3)'}}>...</span>);
            }
            buttons.push(
                <button key={totalPages} className="pagination__btn" onClick={() => onChange(totalPages)}>{totalPages}</button>
            );
        }

        return buttons;
    };

    return (
        <div className="pagination">
            <div className="pagination__info">
                Showing <b>{((page - 1) * perPage) + 1}</b> to <b>{Math.min(page * perPage, total)}</b> of <b>{total}</b>
            </div>
            <div className="pagination__buttons">
                <button
                    className="pagination__btn"
                    disabled={page === 1}
                    onClick={() => onChange(page - 1)}
                >
                    &lt;
                </button>
                {renderButtons()}
                <button
                    className="pagination__btn"
                    disabled={page === totalPages}
                    onClick={() => onChange(page + 1)}
                >
                    &gt;
                </button>
            </div>
        </div>
    );
}
