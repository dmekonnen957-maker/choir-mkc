<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Member extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
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

    protected $casts = [
        'join_date' => 'date',
        'is_public' => 'boolean',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function voiceSection()
    {
        return $this->belongsTo(VoiceSection::class);
    }

    public function attendanceRecords()
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function performances()
    {
        return $this->belongsToMany(Performance::class, 'performance_members')
                    ->withPivot('expected', 'participation_status', 'notes')
                    ->withTimestamps();
    }

    // Accessors
    public function getFullNameAttribute()
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }
}