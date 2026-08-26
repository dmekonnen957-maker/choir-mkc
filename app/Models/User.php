<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'email', 'phone', 'password', 'role', 'status', 'approved_at', 'approved_by', 'rejection_reason'])]
    #[Hidden(['password', 'remember_token'])]
    class User extends Authenticatable
    {
        /** @use HasFactory<UserFactory> */
        use HasFactory, Notifiable, HasApiTokens, HasRoles;

        protected string $guard_name = 'api';

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'approved_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function approvedUsers(): HasMany
    {
        return $this->hasMany(User::class, 'approved_by');
    }

    public function choirs(): BelongsToMany
    {
        return $this->belongsToMany(Choir::class)
            ->withPivot(['is_primary_leader', 'status'])
            ->withTimestamps();
    }

    public function ledChoirs(): HasMany
    {
        return $this->hasMany(Choir::class, 'team_leader_id');
    }

    public function createdChoirs(): HasMany
    {
        return $this->hasMany(Choir::class, 'created_by');
    }

    public function createdSongs(): HasMany
    {
        return $this->hasMany(Song::class, 'created_by');
    }

    public function updatedSongs(): HasMany
    {
        return $this->hasMany(Song::class, 'updated_by');
    }

    public function createdRehearsals(): HasMany
    {
        return $this->hasMany(Rehearsal::class, 'created_by');
    }

    public function createdPerformances(): HasMany
    {
        return $this->hasMany(Performance::class, 'created_by');
    }

    public function updatedPerformances(): HasMany
    {
        return $this->hasMany(Performance::class, 'updated_by');
    }

    public function createdAnnouncements(): HasMany
    {
        return $this->hasMany(Announcement::class, 'created_by');
    }

    public function songHistories(): HasMany
    {
        return $this->hasMany(SongHistory::class, 'created_by');
    }

    public function songFiles(): HasMany
    {
        return $this->hasMany(SongFile::class, 'uploaded_by');
    }

    public function galleryItems(): HasMany
    {
        return $this->hasMany(GalleryItem::class, 'uploaded_by');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'user_id');
    }
}
