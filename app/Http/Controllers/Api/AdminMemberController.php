<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\Api\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class AdminMemberController extends ApiController
{
    /**
     * List choir members across every choir or filtered by choir_id (admin scope).
     * Authorization is handled by the route middleware (permission:members.view).
     *
     * Members are represented by the User model (role = member) attached to
     * choirs via the choir_user pivot.
     */
    public function index(Request $request)
    {
        $query = User::with(['choirs', 'roles', 'approvedBy'])
            ->where(function ($q) {
                $q->where('role', 'member')
                    ->orWhereHas('roles', fn ($r) => $r->where('name', 'member'));
            });

        // Strict Filter by choir
        if ($request->filled('choir_id') && $request->choir_id !== 'all' && $request->choir_id !== '') {
            $choirId = (int) $request->choir_id;
            $query->whereHas('choirs', function ($q) use ($choirId) {
                $q->where('choirs.id', $choirId);
            });
        }

        // Filter by member status
        if ($request->filled('status') && $request->status !== 'all' && $request->status !== '') {
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

        $query->latest();

        return $this->paginate($query, UserResource::class);
    }
}
