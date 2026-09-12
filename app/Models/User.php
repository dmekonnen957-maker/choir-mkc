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

#[Fillable(['name', 'username', 'email', 'phone', 'password', 'role', 'status', 'approved_at', 'approved_by', 'rejection_reason', 'notification_preferences', 'language', 'timezone', 'deactivated_at'])]
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
     * Default notification preferences merged for every user so individual
     * flags are never missing from the stored (or empty) preferences.
     */
    public const DEFAULT_NOTIFICATION_PREFERENCES = [
        'performances' => true,
        'rehearsals' => true,
        'choir_updates' => true,
    ];

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
            'deactivated_at' => 'datetime',
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

    public function isGlobalAdmin(): bool
    {
        $legacyRole = strtolower(trim((string) $this->getAttribute('role')));

        return in_array($legacyRole, ['admin', 'super-admin'], true)
            || $this->hasAnyRole(['admin', 'super-admin'], 'api');
    }

    public function getNotificationPreferencesAttribute($value): array
    {
        $defaults = self::DEFAULT_NOTIFICATION_PREFERENCES;

        if (is_array($value)) {
            return array_merge($defaults, $value);
        }

        if (is_null($value)) {
            return $defaults;
        }

        $decoded = json_decode((string) $value, true);

        return array_merge($defaults, is_array($decoded) ? $decoded : []);
    }

    public function setNotificationPreferencesAttribute($value): void
    {
        $this->attributes['notification_preferences'] = is_array($value) ? json_encode($value) : $value;
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

    public function songLikes(): HasMany
    {
        return $this->hasMany(SongLike::class);
    }

    public function likedSongs(): BelongsToMany
    {
        return $this->belongsToMany(Song::class, 'song_likes')->withTimestamps();
    }
}
