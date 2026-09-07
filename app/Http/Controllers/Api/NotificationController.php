<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Notification\StoreNotificationRequest;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class NotificationController extends ApiController
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $notifications = Notification::where('notifiable_type', User::class)
            ->where('notifiable_id', $userId)
            ->latest()
            ->take(30)
            ->get();

        $unreadCount = Notification::where('notifiable_type', User::class)
            ->where('notifiable_id', $userId)
            ->whereNull('read_at')
            ->count();

        return $this->ok([
            'notifications' => $notifications,
            'items' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAsRead(Request $request, Notification $notification)
    {
        if ($notification->notifiable_id != $request->user()->id) {
            return $this->forbidden('Unauthorized access to notification');
        }

        if (! $notification->read_at) {
            $notification->update(['read_at' => now()]);
        }

        return $this->ok($notification, 'Marked as read');
    }

    public function markAllAsRead(Request $request)
    {
        Notification::where('notifiable_type', User::class)
            ->where('notifiable_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return $this->ok(null, 'All notifications marked as read');
    }

    public function store(StoreNotificationRequest $request)
    {
        $data = $request->validated();

        $notification = Notification::create([
            'id' => (string) Str::uuid(),
            'type' => $data['type'],
            'notifiable_type' => User::class,
            'notifiable_id' => $data['notifiable_user_id'],
            'data' => $data['data'],
            'read_at' => null,
        ]);

        return $this->ok($notification, 'Created', 201);
    }
}
