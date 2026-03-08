<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    public $timestamps = false;
    protected $table = 'inventory';
    protected $fillable = ['product_id', 'current_stock', 'reorder_threshold', 'last_adjusted_at'];
    protected $casts = ['last_adjusted_at' => 'datetime'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function isLowStock(): bool
    {
        return $this->current_stock <= $this->reorder_threshold;
    }
}
