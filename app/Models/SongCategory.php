<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SongCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'choir_id',
        'name',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function choir(): BelongsTo
    {
        return $this->belongsTo(Choir::class);
    }

    public function songs(): HasMany
    {
        return $this->hasMany(Song::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
