<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Role\StoreRoleRequest;
use App\Http\Requests\Api\Role\UpdateRoleRequest;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class RoleController extends ApiController
{
    private const CORE_ROLES = ['super-admin', 'admin', 'team_leader', 'member'];

    public function index(Request $request)
    {
        $this->authorize('viewAny', Role::class);

        $query = Role::where('guard_name', 'api')
            ->with('permissions')
            ->withCount('users');

        if ($request->filled('search')) {
            $search = '%' . trim($request->search) . '%';
            $query->where('name', 'like', $search);
        }

        $roles = $query->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'guard_name' => $role->guard_name,
                'is_core' => in_array($role->name, self::CORE_ROLES),
                'users_count' => $role->users_count,
                'permissions_count' => $role->permissions->count(),
                'permissions' => $role->permissions->pluck('name'),
                'created_at' => $role->created_at,
            ];
        });

        return $this->ok($roles);
    }

    public function store(StoreRoleRequest $request)
    {
        $this->authorize('create', Role::class);

        $data = $request->validated();

        $role = Role::create([
            'name' => $data['name'],
            'guard_name' => 'api',
        ]);

        if ($request->filled('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'role.created',
            'subject_type' => Role::class,
            'subject_id' => $role->id,
            'new_values' => ['name' => $role->name, 'permissions' => $request->permissions ?? []],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->ok([
            'id' => $role->id,
            'name' => $role->name,
            'guard_name' => $role->guard_name,
            'is_core' => in_array($role->name, self::CORE_ROLES),
            'permissions' => $role->permissions()->pluck('name'),
        ], 'Role created successfully', 201);
    }

    public function show(Request $request, Role $role)
    {
        $this->authorize('view', $role);

        $role->load(['permissions', 'users.choirs']);

        return $this->ok([
            'id' => $role->id,
            'name' => $role->name,
            'guard_name' => $role->guard_name,
            'is_core' => in_array($role->name, self::CORE_ROLES),
            'users_count' => $role->users->count(),
            'permissions_count' => $role->permissions->count(),
            'permissions' => $role->permissions->pluck('name'),
            'users' => $role->users->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'phone' => $u->phone,
                    'status' => $u->status,
                    'choir' => $u->choirs->first() ? [
                        'id' => $u->choirs->first()->id,
                        'name' => $u->choirs->first()->name,
                    ] : null,
                ];
            }),
            'created_at' => $role->created_at,
        ]);
    }

    public function update(UpdateRoleRequest $request, Role $role)
    {
        $this->authorize('update', $role);

        $data = $request->validated();
        $oldValues = [
            'name' => $role->name,
            'permissions' => $role->permissions->pluck('name')->toArray(),
        ];

        // Guard core role rename
        if (in_array($role->name, self::CORE_ROLES) && $role->name !== $data['name']) {
            return $this->error('Core system role names cannot be renamed.', null, 422);
        }

        $role->update([
            'name' => $data['name'],
        ]);

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions ?? []);
        }

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'role.updated',
            'subject_type' => Role::class,
            'subject_id' => $role->id,
            'old_values' => $oldValues,
            'new_values' => ['name' => $role->name, 'permissions' => $request->permissions ?? []],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->ok([
            'id' => $role->id,
            'name' => $role->name,
            'guard_name' => $role->guard_name,
            'is_core' => in_array($role->name, self::CORE_ROLES),
            'permissions' => $role->permissions()->pluck('name'),
        ], 'Role updated successfully');
    }

    public function destroy(Request $request, Role $role)
    {
        $this->authorize('delete', $role);

        if (in_array($role->name, self::CORE_ROLES)) {
            return $this->error('Core system roles cannot be deleted.', null, 422);
        }

        if ($role->users()->count() > 0) {
            return $this->error('This role cannot be deleted because users are assigned to it. Please reassign users first.', null, 422);
        }

        $oldValues = ['name' => $role->name];

        $role->delete();

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'role.deleted',
            'subject_type' => Role::class,
            'subject_id' => $role->id,
            'old_values' => $oldValues,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->ok(null, 'Role deleted successfully');
    }
}
