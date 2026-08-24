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
            $spatieRole = Role::findByName($roleName, 'api');
            $user->syncRoles([$spatieRole]);
        } catch (\Throwable) {
            // fallback
        }

        // Assign choir
        if ($choirId) {
            $user->choirs()->sync([
                $choirId => [
                    'is_primary_leader' => ($roleName === 'team_leader'),
                    'status' => 'active',
                ],
            ]);
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
                $spatieRole = Role::findByName($data['role'], 'api');
                if ($spatieRole) {
                    $user->syncRoles([$spatieRole]);
                }
            } catch (\Throwable) {
                // Ignore if Spatie role not defined
            }
        } elseif ($request->filled('roles')) {
            $user->syncRoles($request->roles);
        }

        // Handle choir assignment
        if ($request->has('choir_id')) {
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

                    // Update or create linked Member record
                    $nameParts = explode(' ', $user->name, 2);
                    $firstName = $nameParts[0] ?? $user->name;
                    $lastName = $nameParts[1] ?? '';
                    $codePrefix = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $choir->name ?? 'CHOIR'), 0, 3));
                    $memberCode = $codePrefix . '-' . str_pad((string)$user->id, 4, '0', STR_PAD_LEFT);

                    Member::updateOrCreate(
                        ['user_id' => $user->id],
                        [
                            'choir_id' => $choir->id,
                            'member_code' => $memberCode,
                            'first_name' => $firstName,
                            'last_name' => $lastName,
                            'email' => $user->email,
                            'phone' => $user->phone,
                            'status' => 'active',
                        ]
                    );
                }
            } else {
                $user->choirs()->detach();
            }
        }

        return $this->ok(UserResource::make($user->load('roles', 'permissions', 'choirs', 'approvedBy')), 'User updated successfully');
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

        $user->delete();

        return $this->ok(null, 'User deleted successfully');
    }
}
