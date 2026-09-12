<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\User\StoreUserRequest;
use App\Http\Requests\Api\User\UpdateUserRequest;
use App\Http\Resources\Api\UserResource;
use App\Models\Choir;
use App\Models\Member;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class UserController extends ApiController
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $query = User::with(['roles', 'choirs', 'approvedBy'])->latest();

        // Filter by approval status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by role
        if ($request->filled('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        // Filter by choir
        if ($request->filled('choir_id') && $request->choir_id !== 'all') {
            $query->whereHas('choirs', function ($q) use ($request) {
                $q->where('choirs.id', $request->choir_id);
            });
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

    public function store(StoreUserRequest $request)
    {
        $this->authorize('create', User::class);

        $data = $request->validated();
        $data['password'] = bcrypt($data['password']);
        $choirId = $data['choir_id'] ?? null;
        unset($data['choir_id']);

        if (!isset($data['status'])) {
            $data['status'] = User::STATUS_APPROVED;
            $data['approved_at'] = now();
            $data['approved_by'] = $request->user()->id;
        }

        $user = User::create($data);

        // Assign Spatie role
        $roleName = $data['role'] ?? 'member';
        try {
            $spatieRole = Role::where('name', $roleName)->where('guard_name', 'api')->first()
                ?? Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'api']);
            $user->syncRoles([$spatieRole]);
            app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        } catch (\Throwable) {
            // fallback
        }

        // Assign choir
        if ($choirId && ! in_array($roleName, ['admin', 'super-admin'], true)) {
            $choir = Choir::find($choirId);

            if ($choir) {
                $user->choirs()->sync([
                    $choir->id => [
                        'is_primary_leader' => ($roleName === 'team_leader'),
                        'status' => 'active',
                    ],
                ]);

                // Keep the roster record in sync so the new member immediately
                // appears on the Attendance page.
                $this->syncMemberForChoir($user, $choir);
            }
        }

        return $this->ok(UserResource::make($user->load('roles', 'choirs', 'approvedBy')), 'Created', 201);
    }

    public function show(Request $request, User $user)
    {
        $this->authorize('view', $user);

        return $this->ok(UserResource::make($user->load('roles', 'permissions', 'choirs', 'approvedBy')));
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $this->authorize('update', $user);

        $data = $request->validated();

        if (isset($data['password']) && !empty($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        } else {
            unset($data['password']);
        }

        $choirId = $data['choir_id'] ?? null;
        unset($data['choir_id']);

        // Handle status change
        if (isset($data['status'])) {
            if ($data['status'] === User::STATUS_APPROVED && $user->status !== User::STATUS_APPROVED) {
                $data['approved_at'] = now();
                $data['approved_by'] = $request->user()->id;
                $data['rejection_reason'] = null;
            } elseif ($data['status'] === User::STATUS_REJECTED) {
                $data['rejection_reason'] = $data['rejection_reason'] ?? $user->rejection_reason;
            }
        }

        $user->update($data);

        // Handle role change
        if (isset($data['role'])) {
            try {
                $spatieRole = Role::where('name', $data['role'])->where('guard_name', 'api')->first()
                    ?? Role::firstOrCreate(['name' => $data['role'], 'guard_name' => 'api']);
                if ($spatieRole) {
                    $user->syncRoles([$spatieRole]);
                    app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
                }
            } catch (\Throwable) {
                // Ignore if Spatie role not defined
            }
        } elseif ($request->filled('roles')) {
            $user->syncRoles($request->roles);
            app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        }

        // Global administrators do not receive a choir assignment.
        if ($user->isGlobalAdmin()) {
            $user->choirs()->detach();
            Member::where('user_id', $user->id)
                ->where('status', 'active')
                ->update(['status' => 'inactive']);
        } elseif ($request->has('choir_id')) {
            if ($choirId) {
                $choir = Choir::find($choirId);
                if ($choir) {
                    $isLeader = in_array($user->role, ['team_leader', 'admin', 'super-admin']);
                    $user->choirs()->sync([
                        $choir->id => [
                            'is_primary_leader' => $isLeader,
                            'status' => 'active',
                        ],
                    ]);

                    // Keep the roster record in sync (create or re-activate).
                    $this->syncMemberForChoir($user, $choir);
                }

                // Any member records for choirs the user no longer belongs to
                // must not appear in attendance or member counts anymore.
                $this->deactivateMembersForRemovedChoirs($user);
            } else {
                $user->choirs()->detach();

                // The user is no longer assigned to any choir, so their linked
                // roster records must not appear anywhere as active members.
                Member::where('user_id', $user->id)
                    ->where('status', 'active')
                    ->update(['status' => 'inactive']);
            }
        }

        return $this->ok(UserResource::make($user->load('roles', 'permissions', 'choirs', 'approvedBy')), 'User updated successfully');
    }

    /**
     * Create or reactivate the roster (Member) record that ties a user to a
     * choir. Attendance is built from these active records, so a newly assigned
     * user automatically appears on the Attendance page.
     */
    private function syncMemberForChoir(User $user, Choir $choir): void
    {
        $nameParts = explode(' ', $user->name, 2);
        $firstName = $nameParts[0] ?? $user->name;
        $lastName = $nameParts[1] ?? '';
        $codePrefix = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $choir->name ?? 'CHOIR'), 0, 3));
        $memberCode = $codePrefix . '-' . str_pad((string) $user->id, 4, '0', STR_PAD_LEFT);

        $updates = [
            'member_code' => $memberCode,
            'first_name'  => $firstName,
            'last_name'   => $lastName,
            'email'       => $user->email,
            'phone'       => $user->phone,
            'status'      => 'active',
            'deleted_at'  => null, // restore if soft-deleted
        ];

        // Use withTrashed so soft-deleted records are restored instead of
        // creating a duplicate (which would violate the unique choir_id+user_id
        // constraint in a future migration and cause confusing duplicates).
        $existing = Member::withTrashed()
            ->where('user_id', $user->id)
            ->where('choir_id', $choir->id)
            ->first();

        if ($existing) {
            $existing->fill($updates)->save();
        } else {
            Member::create(array_merge($updates, [
                'choir_id' => $choir->id,
                'user_id'  => $user->id,
            ]));
        }
    }

    /**
     * Soft-deactivate Member records for choirs the user is no longer assigned
     * to (kept as "inactive" so historical attendance stays linked).
     */
    private function deactivateMembersForRemovedChoirs(User $user): void
    {
        $assignedChoirIds = $user->choirs()->pluck('choirs.id');

        Member::where('user_id', $user->id)
            ->where('status', 'active')
            ->whereNotIn('choir_id', $assignedChoirIds)
            ->update(['status' => 'inactive']);
    }

    public function approve(Request $request, User $user)
    {
        $this->authorize('update', $user);

        $user->status = User::STATUS_APPROVED;
        $user->approved_at = now();
        $user->approved_by = $request->user()->id;
        $user->rejection_reason = null;
        $user->save();

        return $this->ok(
            UserResource::make($user->load('roles', 'permissions', 'choirs', 'approvedBy')),
            'User approved successfully'
        );
    }

    public function reject(Request $request, User $user)
    {
        $this->authorize('update', $user);

        $reason = $request->input('rejection_reason', $request->input('reason', 'Registration not approved by administrator.'));

        $user->status = User::STATUS_REJECTED;
        $user->rejection_reason = $reason;
        $user->save();

        return $this->ok(
            UserResource::make($user->load('roles', 'permissions', 'choirs', 'approvedBy')),
            'User registration rejected'
        );
    }

    public function destroy(Request $request, User $user)
    {
        $this->authorize('delete', $user);

        if ($request->user()->id === $user->id) {
            return $this->error('Cannot delete yourself', null, 422);
        }

        try {
            $user->tokens()->delete();
            // Note: The UserObserver::deleting() event will automatically
            // soft-delete any linked Member records, preserving attendance
            // history while removing the member from the active roster.
            $user->delete();
        } catch (\Illuminate\Database\QueryException $e) {
            return $this->error(
                'This user cannot be deleted because they have related records (choirs, members, or activity logs). '
                    . 'Deactivate the user instead, or remove those records first.',
                null,
                422
            );
        }

        return $this->ok(null, 'User deleted successfully');
    }
}
