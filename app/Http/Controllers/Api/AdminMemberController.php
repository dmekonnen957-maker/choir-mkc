<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\Api\MemberResource;
use App\Models\Member;
use Illuminate\Http\Request;

class AdminMemberController extends ApiController
{
    /**
     * List all choir members across every choir (admin scope).
     * Authorization: members.view (see MemberPolicy::viewAny).
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Member::class);

        $query = Member::with(['choir', 'user.roles'])->latest();

        // Filter by choir
        if ($request->filled('choir_id') && $request->choir_id !== 'all') {
            $query->where('choir_id', $request->choir_id);
        }

        // Filter by member status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Search by name, email, or phone
        if ($request->filled('search')) {
            $search = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', $search)
                    ->orWhere('last_name', 'like', $search)
                    ->orWhere('email', 'like', $search)
                    ->orWhere('phone', 'like', $search);
            });
        }

        return $this->paginate($query, MemberResource::class);
    }
}
