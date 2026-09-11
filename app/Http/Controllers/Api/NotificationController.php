<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Notification\StoreNotificationRequest;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class NotificationController extends ApiController
{
    /**
     * List the authenticated user's notifications with pagination.
     * Returns both a paginated items list and the unread count.
     */
    public function index(Request $request)
    {
        $userId  = $request->user()->id;
        $perPage = min((int) $request->input('per_page', 20), 50);

        $notifications = Notification::where('notifiable_type', User::class)
            ->where('notifiable_id', $userId)
            ->latest()
            ->paginate($perPage);

        $unreadCount = Notification::where('notifiable_type', User::class)
            ->where('notifiable_id', $userId)
            ->whereNull('read_at')
            ->count();

        return $this->ok([
            'items'       => $notifications->items(),
            'pagination'  => [
                'current_page' => $notifications->currentPage(),
                'last_page'    => $notifications->lastPage(),
                'per_page'     => $notifications->perPage(),
                'total'        => $notifications->total(),
            ],
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAsRead(Request $request, Notification $notification)
    {
        if ($notification->notifiable_id != $request->user()->id) {
            return $this->error('Unauthorized access to notification', null, 403);
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
            'id'             => (string) Str::uuid(),
            'type'           => $data['type'],
            'notifiable_type' => User::class,
            'notifiable_id'  => $data['notifiable_user_id'],
            'data'           => $data['data'],
            'read_at'        => null,
        ]);

        return $this->ok($notification, 'Created', 201);
    }
}
