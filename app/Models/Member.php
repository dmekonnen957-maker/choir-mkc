<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Member extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'choir_id',
        'member_code',
        'user_id',
        'voice_section_id',
        'first_name',
        'last_name',
        'photo_path',
        'phone',
        'email',
        'join_date',
        'role_title',
        'status',
        'bio',
        'notes',
        'is_public',
    ];

    protected function casts(): array
    {
        return [
            'join_date' => 'date',
            'is_public' => 'boolean',
        ];
    }

    public function choir(): BelongsTo
    {
        return $this->belongsTo(Choir::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function voiceSection(): BelongsTo
    {
        return $this->belongsTo(VoiceSection::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function performances(): BelongsToMany
    {
        return $this->belongsToMany(Performance::class, 'performance_members')
            ->withPivot(['choir_id', 'expected', 'participation_status', 'notes'])
            ->withTimestamps();
    }

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    public function scopeForChoir($query, $choirId)
    {
        return $query->where('choir_id', $choirId);
    }
}
