<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\Api\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class AdminMemberController extends ApiController
{
    /**
     * List all choir members across every choir (admin scope).
     * Authorization is handled by the route middleware (permission:members.view).
     *
     * Members are represented by the User model (role = member) attached to
     * choirs via the choir_user pivot — not the legacy soft-deletable members table.
     */
    public function index(Request $request)
    {
        $query = User::with('choirs')->where('role', 'member');

        // Filter by choir
        if ($request->filled('choir_id') && $request->choir_id !== 'all') {
            $query->whereHas('choirs', function ($q) use ($request) {
                $q->where('choirs.id', $request->choir_id);
            });
        }

        // Filter by member status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Search by name, email, or phone
        if ($request->filled('search')) {
            $search = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                    ->orWhere('email', 'like', $search)
                    ->orWhere('phone', 'like', $search);
            });
        }

        return $this->paginate($query, UserResource::class);
    }
}
