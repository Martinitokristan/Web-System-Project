import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';

export default function ProductDetailModal({ isOpen, onClose, product, onAddToCart }) {
    const [qty, setQty] = useState(1);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);

    useEffect(() => {
        if (isOpen && product) {
            setQty(product.qty || 1);
            setSelectedColor(product.selectedVariants?.Color || null);
            setSelectedSize(product.selectedVariants?.Size || null);
        }
    }, [isOpen, product]);

    if (!product) return null;

    const allVariants = product.product_variants || [];
    const hasVariants = allVariants.length > 0;

    // Deduplicate unique colors and sizes across ALL variants
    const colorMap = {};
    const sizeMap = {};
    allVariants.forEach(v => {
        if (v.color_value) colorMap[v.color_value_id] = v.color_value;
        if (v.size_value)  sizeMap[v.size_value_id]  = v.size_value;
    });
    const availableColors = Object.values(colorMap);
    const availableSizes  = Object.values(sizeMap);
    const hasColors = availableColors.length > 0;
    const hasSizes  = availableSizes.length  > 0;

    // Total variant stock for this product (product-level availability)
    const totalVariantStock = allVariants.reduce((s, v) => s + (v.stock || 0), 0);

    // Helper: get the variant matching a size+color combo
    const findVariant = (sizeId, colorId) =>
        allVariants.find(v =>
            (sizeId  ? v.size_value_id  === sizeId  : !v.size_value_id)  &&
            (colorId ? v.color_value_id === colorId : !v.color_value_id)
        );

    // Stock for a specific color (sum across all sizes for that color, or specific combo)
    const stockForColor = (colorId) => {
        if (selectedSize) {
            const v = findVariant(selectedSize.id, colorId);
            return v ? v.stock : 0;
        }
        return allVariants
            .filter(v => v.color_value_id === colorId)
            .reduce((s, v) => s + (v.stock || 0), 0);
    };

    // Stock for a specific size
    const stockForSize = (sizeId) => {
        if (selectedColor) {
            const v = findVariant(sizeId, selectedColor.id);
            return v ? v.stock : 0;
        }
        return allVariants
            .filter(v => v.size_value_id === sizeId)
            .reduce((s, v) => s + (v.stock || 0), 0);
    };

    // Active combination (only meaningful when both are chosen, or single-type variant)
    const activeCombo = hasVariants
        ? findVariant(
            hasSizes  ? selectedSize?.id  : undefined,
            hasColors ? selectedColor?.id : undefined
          )
        : null;

    // Current price and stock
    const currentPrice = activeCombo?.price_override || product.sell_price;

    // Stock display:
    // - No variants: use inventory
    // - Has variants, nothing selected: show total
    // - Has variants + partial/full selection: show combo stock
    let currentStock;
    if (!hasVariants) {
        currentStock = product.inventory?.current_stock || 0;
    } else if (activeCombo) {
        currentStock = activeCombo.stock;
    } else if (selectedColor && !hasSizes) {
        currentStock = stockForColor(selectedColor.id);
    } else if (selectedSize && !hasColors) {
        currentStock = stockForSize(selectedSize.id);
    } else {
        currentStock = totalVariantStock;
    }

    const isOutOfStock = currentStock <= 0;
    const isLowStock   = currentStock > 0 && currentStock <= 5;
    const subtotal     = currentPrice * qty;

    // All selections required before adding to cart
    const needsSize  = hasSizes  && !selectedSize;
    const needsColor = hasColors && !selectedColor;
    const selectionComplete = !needsSize && !needsColor;
    const canAdd = selectionComplete && !isOutOfStock && (!hasVariants || activeCombo);

    const handleAddToCart = () => {
        if (!canAdd) return;
        onAddToCart(product, {
            qty,
            variants: { Size: selectedSize, Color: selectedColor },
            price: currentPrice,
            variant_id: activeCombo?.id,
            isUpdate: !!product.cartId // Flag to indicate we're updating an existing cart item
        });
        onClose();
    };

    const handleColorClick = (color) => {
        setSelectedColor(prev => prev?.id === color.id ? null : color);
    };

    const handleSizeClick = (size) => {
        setSelectedSize(prev => prev?.id === size.id ? null : size);
    };

    // Stock badge helper
    const stockBadge = (stock) => {
        if (stock <= 0)  return { label: 'Out', cls: 'pdm-stock-out' };
        if (stock <= 5)  return { label: `${stock} left`, cls: 'pdm-stock-low' };
        return null; // no badge for plenty of stock
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Product Details" size="lg" hideFooter>
            <div className="pdm-wrap">
                {/* ── Left: image area ── */}
                <div className="pdm-left">
                    <div className="pdm-img-main">
                        {product.image_path
                            ? <img src={`/storage/${product.image_path}`} alt={product.name} />
                            : <div className="pdm-img-fallback">📦</div>}

                        {/* Color overlay badge */}
                        {selectedColor && (
                            <div className="pdm-color-badge" style={{ background: selectedColor.hex_code || '#666' }}>
                                {selectedColor.label}
                            </div>
                        )}
                    </div>

                    {/* Color thumbnails */}
                    {hasColors && (
                        <div className="pdm-color-thumbs">
                            {availableColors.map(color => {
                                const isSelected = selectedColor?.id === color.id;
                                const s = stockForColor(color.id);
                                return (
                                    <button
                                        key={color.id}
                                        title={color.label}
                                        onClick={() => handleColorClick(color)}
                                        className={`pdm-color-thumb ${isSelected ? 'active' : ''} ${s <= 0 ? 'pdm-thumb-out' : ''}`}
                                    >
                                        <div className="pdm-color-swatch" style={{ background: color.hex_code || '#ccc' }} />
                                        <span>{color.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Right: product info + selectors ── */}
                <div className="pdm-right">
                    <div className="pdm-category">{product.category?.name}</div>
                    <h1 className="pdm-name">{product.name}</h1>


                    <div className="pdm-price-row">
                        <div className="pdm-price">₱{Number(currentPrice).toFixed(2)}</div>

                    </div>

                    {/* Stock status badge */}
                    <div className="pdm-stock-row">
                        {selectionComplete
                            ? isOutOfStock
                                ? <span className="pdm-badge pdm-badge--out">Out of Stock</span>
                                : isLowStock
                                    ? <span className="pdm-badge pdm-badge--low">⚠️ Only {currentStock} left!</span>
                                    : <span className="pdm-badge pdm-badge--in">✓ {currentStock} pcs available</span>
                            : hasVariants
                                ? <span className="pdm-badge pdm-badge--neutral">Select options to see stock</span>
                                : isOutOfStock
                                    ? <span className="pdm-badge pdm-badge--out">Out of Stock</span>
                                    : <span className="pdm-badge pdm-badge--in">✓ {currentStock} pcs available</span>
                        }
                    </div>

                    {product.description && (
                        <p className="pdm-desc">{product.description}</p>
                    )}

                    {/* ── Color selector (always visible) ── */}
                    {hasColors && (
                        <div className="pdm-variant-block">
                            <div className="pdm-variant-label">
                                Color
                                {selectedColor
                                    ? <span className="pdm-variant-selected"> — {selectedColor.label}</span>
                                    : <span className="pdm-variant-required"> (required)</span>}
                            </div>
                            <div className="pdm-color-btn-list">
                                {availableColors.map(color => {
                                    const isSelected = selectedColor?.id === color.id;
                                    const s = stockForColor(color.id);
                                    const badge = stockBadge(s);
                                    return (
                                        <button
                                            key={color.id}
                                            onClick={() => handleColorClick(color)}
                                            className={`pdm-color-btn ${isSelected ? 'active' : ''} ${s <= 0 ? 'unavail' : ''}`}
                                        >
                                            {color.hex_code && (
                                                <span className="pdm-swatch" style={{ background: color.hex_code }} />
                                            )}
                                            {color.label}
                                            {badge && <span className={`pdm-variant-stock ${badge.cls}`}>{badge.label}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Size selector (always visible) ── */}
                    {hasSizes && (
                        <div className="pdm-variant-block">
                            <div className="pdm-variant-label">
                                Size
                                {selectedSize
                                    ? <span className="pdm-variant-selected"> — {selectedSize.label}</span>
                                    : <span className="pdm-variant-required"> (required)</span>}
                            </div>
                            <div className="pdm-size-btn-list">
                                {availableSizes.map(size => {
                                    const isSelected = selectedSize?.id === size.id;
                                    const s = stockForSize(size.id);
                                    const badge = stockBadge(s);
                                    return (
                                        <button
                                            key={size.id}
                                            onClick={() => handleSizeClick(size)}
                                            className={`pdm-size-btn ${isSelected ? 'active' : ''} ${s <= 0 ? 'unavail' : ''}`}
                                        >
                                            {size.label}
                                            {badge && <span className={`pdm-variant-stock ${badge.cls}`}>{badge.label}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Warn if combo not valid after full selection */}
                    {hasVariants && selectionComplete && !activeCombo && (
                        <div className="pdm-warn">⚠️ This combination is not available.</div>
                    )}

                    {/* ── Add to cart controls ── */}
                    <div className="pdm-buy-row">
                        <div className="pdm-qty">
                            <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                            <span>{qty}</span>
                            <button onClick={() => setQty(q => Math.min(q + 1, currentStock || 999))}>+</button>
                        </div>
                        <button
                            disabled={!canAdd}
                            onClick={handleAddToCart}
                            className={`pdm-add-btn ${!canAdd ? 'pdm-add-btn--disabled' : ''}`}
                        >
                            {isOutOfStock && selectionComplete
                                ? 'Out of Stock'
                                : (needsColor || needsSize)
                                    ? `Select ${[needsColor ? 'Color' : '', needsSize ? 'Size' : ''].filter(Boolean).join(' & ')}`
                                    : (product.cartId ? `Update Cart — ₱${subtotal.toFixed(2)}` : `Add to Cart — ₱${subtotal.toFixed(2)}`)}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .pdm-wrap {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0;
                    min-height: 420px;
                }
                @media(max-width:650px){ .pdm-wrap { grid-template-columns: 1fr; } }

                /* LEFT */
                .pdm-left {
                    padding: 20px;
                    border-right: 1px solid var(--border);
                    display: flex; flex-direction: column; gap: 12px;
                }
                .pdm-img-main {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 1/1;
                    border-radius: 14px;
                    overflow: hidden;
                    border: 1px solid var(--border);
                    background: #f8f9fa;
                }
                .pdm-img-main img { width: 100%; height: 100%; object-fit: cover; }
                .pdm-img-fallback { width: 100%; height: 100%; display: grid; place-items: center; font-size: 5rem; }
                .pdm-color-badge {
                    position: absolute; bottom: 10px; left: 10px;
                    color: #fff; font-size: 0.7rem; font-weight: 700;
                    padding: 3px 10px; border-radius: 100px; letter-spacing: 0.05em;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.4);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                }
                .pdm-color-thumbs {
                    display: flex; gap: 8px; flex-wrap: wrap;
                }
                .pdm-color-thumb {
                    display: flex; flex-direction: column; align-items: center; gap: 3px;
                    border: 2px solid transparent; border-radius: 8px;
                    padding: 5px; cursor: pointer; background: none;
                    transition: all 0.15s; font-size: 0.65rem; color: var(--text3); font-weight: 600;
                }
                .pdm-color-thumb:hover { border-color: var(--border); }
                .pdm-color-thumb.active { border-color: var(--accent); }
                .pdm-thumb-out { opacity: 0.4; }
                .pdm-color-swatch {
                    width: 32px; height: 32px; border-radius: 50%;
                    border: 2px solid rgba(0,0,0,0.08);
                    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                }

                /* RIGHT */
                .pdm-right {
                    padding: 20px 24px;
                    display: flex; flex-direction: column; gap: 10px;
                    overflow-y: auto; max-height: 75vh;
                }
                .pdm-category {
                    display: inline-block; background: var(--surface2);
                    padding: 3px 10px; border-radius: 20px;
                    font-size: 0.7rem; font-weight: 700; color: var(--text3);
                }
                .pdm-name { font-size: 1.5rem; font-weight: 800; margin: 0; color: var(--text); line-height: 1.2; }
                .pdm-sku { font-size: 0.8rem; color: var(--text3); }
                .pdm-price-row { display: flex; align-items: baseline; gap: 10px; }
                .pdm-price { font-size: 1.75rem; font-weight: 800; color: var(--accent); }
                .pdm-orig-price { font-size: 0.95rem; color: var(--text3); text-decoration: line-through; }
                .pdm-stock-row {}
                .pdm-badge { font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 100px; }
                .pdm-badge--in  { background: #d1fae5; color: #065f46; }
                .pdm-badge--low { background: #fef3c7; color: #92400e; }
                .pdm-badge--out { background: #fee2e2; color: #dc2626; }
                .pdm-badge--neutral { background: #f1f5f9; color: #64748b; }
                .pdm-desc { font-size: 0.875rem; color: var(--text2); line-height: 1.6; margin: 0; }

                /* Variant blocks */
                .pdm-variant-block { display: flex; flex-direction: column; gap: 8px; }
                .pdm-variant-label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text3); }
                .pdm-variant-selected { font-weight: 700; color: var(--accent); text-transform: none; }
                .pdm-variant-required { font-weight: 600; color: #dc2626; text-transform: none; font-size: 0.7rem; }

                /* Stock micro-badge inside variant button */
                .pdm-variant-stock {
                    font-size: 0.62rem; font-weight: 700; padding: 1px 5px;
                    border-radius: 4px; margin-left: 4px;
                }
                .pdm-stock-out { background: #fee2e2; color: #dc2626; }
                .pdm-stock-low { background: #fef3c7; color: #92400e; }

                .pdm-color-btn-list { display: flex; flex-wrap: wrap; gap: 8px; }
                .pdm-color-btn {
                    display: inline-flex; align-items: center; gap: 6px;
                    padding: 7px 14px; border: 1.5px solid var(--border); border-radius: 8px;
                    background: #fff; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
                }
                .pdm-color-btn:hover:not(.unavail) { border-color: var(--accent); }
                .pdm-color-btn.active { border-color: var(--accent); background: rgba(255,140,0,0.06); color: var(--accent); }
                .pdm-color-btn.unavail { opacity: 0.4; cursor: default; }
                .pdm-swatch { width: 14px; height: 14px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1); flex-shrink: 0; }

                .pdm-size-btn-list { display: flex; flex-wrap: wrap; gap: 8px; }
                .pdm-size-btn {
                    display: inline-flex; align-items: center; gap: 4px;
                    padding: 7px 18px; border: 1.5px solid var(--border); border-radius: 8px;
                    background: #fff; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.15s;
                }
                .pdm-size-btn:hover:not(.unavail) { border-color: var(--accent); }
                .pdm-size-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
                .pdm-size-btn.unavail { opacity: 0.4; cursor: default; }

                .pdm-warn { font-size: 0.82rem; color: #dc2626; font-weight: 600; }

                /* Buy controls */
                .pdm-buy-row { display: flex; gap: 12px; align-items: center; margin-top: 6px; }
                .pdm-qty {
                    display: flex; align-items: center; border: 1.5px solid var(--border); border-radius: 9px; overflow: hidden; height: 46px;
                }
                .pdm-qty button {
                    width: 38px; height: 100%; border: none; background: #f8f9fa; font-size: 1.2rem; cursor: pointer; transition: background 0.15s;
                }
                .pdm-qty button:hover { background: #e9ecef; }
                .pdm-qty span { width: 44px; text-align: center; font-weight: 700; font-size: 1rem; }
                .pdm-add-btn {
                    flex: 1; height: 46px; border: none; border-radius: 9px;
                    background: var(--accent); color: #fff; font-size: 0.9rem; font-weight: 700;
                    cursor: pointer; transition: all 0.2s;
                }
                .pdm-add-btn:hover:not(.pdm-add-btn--disabled) { background: #e07b00; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(255,140,0,0.3); }
                .pdm-add-btn--disabled { background: #e9ecef; color: #adb5bd; cursor: not-allowed; }
            `}</style>
        </Modal>
    );
}
