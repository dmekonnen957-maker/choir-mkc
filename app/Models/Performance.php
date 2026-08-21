<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Performance extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'date',
        'start_time',
        'end_time',
        'venue',
        'location',
        'description',
        'organizer',
        'dress_code',
        'special_instructions',
        'status',
        'is_public',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date' => 'date',
        'is_public' => 'boolean',
    ];

    // Relationships
    public function members()
    {
        return $this->belongsToMany(Member::class, 'performance_members')
                    ->withPivot('expected', 'participation_status', 'notes')
                    ->withTimestamps();
    }

    public function songs()
    {
        return $this->belongsToMany(Song::class, 'performance_songs')
                    ->withPivot('sequence_number', 'notes')
                    ->withTimestamps();
    }

    public function rehearsals()
    {
        return $this->belongsToMany(Rehearsal::class, 'performance_rehearsals')
                    ->withTimestamps();
    }

    public function galleryItems()
    {
        return $this->hasMany(GalleryItem::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Scopes
    public function scopeUpcoming($query)
    {
        return $query->where('date', '>=', now()->toDateString())
                     ->whereIn('status', ['scheduled', 'confirmed']);
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }
}