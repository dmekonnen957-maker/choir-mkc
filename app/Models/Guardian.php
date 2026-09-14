<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Guardian extends Model
{
    use HasFactory;

    protected $fillable = [
        'full_name',
        'relationship',
        'relationship_other',
        'phone',
        'alt_phone',
        'email',
        'address',
        'user_id',
    ];

    public function children(): BelongsToMany
    {
        return $this->belongsToMany(Member::class, 'guardian_child')
            ->withPivot(['relationship', 'is_primary'])
            ->withTimestamps();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
