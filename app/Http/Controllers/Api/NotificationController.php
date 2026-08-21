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
        $items = Notification::where('notifiable_type', User::class)
            ->where('notifiable_id', $request->user()->id)
            ->latest()
            ->paginate(20);

        return $this->ok([
            'items' => $items->items(),
            'pagination' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
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
