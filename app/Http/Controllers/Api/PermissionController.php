<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Permission\StorePermissionRequest;
use App\Http\Requests\Api\Permission\UpdatePermissionRequest;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

class PermissionController extends ApiController
{
    private function resolveGroup(string $permissionName): string
    {
        $parts = explode('.', $permissionName);
        $prefix = $parts[0] ?? 'system';
        return match ($prefix) {
            'users' => 'Users',
            'roles' => 'Roles',
            'permissions' => 'Permissions',
            'choirs' => 'Choirs',
            'members' => 'Members',
            'songs' => 'Songs',
            'lyrics' => 'Lyrics',
            'rehearsals' => 'Rehearsals',
            'attendance' => 'Attendance',
            'performances' => 'Performances',
            'announcements' => 'Announcements',
            'gallery' => 'Gallery',
            'notifications' => 'Notifications',
            'reports' => 'Reports',
            'audit_logs' => 'Audit Logs',
            default => ucfirst($prefix),
        };
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', Permission::class);

        $query = Permission::where('guard_name', 'api')
            ->with('roles')
            ->withCount('roles');

        if ($request->filled('search')) {
            $search = '%' . trim($request->search) . '%';
            $query->where('name', 'like', $search);
        }

        $permissions = $query->get()->map(function ($perm) {
            return [
                'id' => $perm->id,
                'name' => $perm->name,
                'key' => $perm->name,
                'group' => $this->resolveGroup($perm->name),
                'guard_name' => $perm->guard_name,
                'roles_count' => $perm->roles_count,
                'roles' => $perm->roles->pluck('name'),
                'created_at' => $perm->created_at,
            ];
        });

        // Optional group filter
        if ($request->filled('group') && $request->group !== 'all') {
            $permissions = $permissions->where('group', $request->group)->values();
        }

        return $this->ok([
            'items' => $permissions,
            'groups' => $permissions->pluck('group')->unique()->values(),
            'total' => $permissions->count(),
        ]);
    }

    public function store(StorePermissionRequest $request)
    {
        $this->authorize('create', Permission::class);

        $data = $request->validated();

        $perm = Permission::create([
            'name' => $data['name'],
            'guard_name' => 'api',
        ]);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'permission.created',
            'subject_type' => Permission::class,
            'subject_id' => $perm->id,
            'new_values' => ['name' => $perm->name],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->ok([
            'id' => $perm->id,
            'name' => $perm->name,
            'key' => $perm->name,
            'group' => $this->resolveGroup($perm->name),
            'guard_name' => $perm->guard_name,
            'roles' => [],
        ], 'Permission created successfully', 201);
    }

    public function show(Request $request, Permission $permission)
    {
        $this->authorize('view', $permission);

        $permission->load('roles');

        return $this->ok([
            'id' => $permission->id,
            'name' => $permission->name,
            'key' => $permission->name,
            'group' => $this->resolveGroup($permission->name),
            'guard_name' => $permission->guard_name,
            'roles_count' => $permission->roles->count(),
            'roles' => $permission->roles->pluck('name'),
            'created_at' => $permission->created_at,
        ]);
    }

    public function update(UpdatePermissionRequest $request, Permission $permission)
    {
        $this->authorize('update', $permission);

        $data = $request->validated();
        $oldValues = ['name' => $permission->name];

        $permission->update([
            'name' => $data['name'],
        ]);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'permission.updated',
            'subject_type' => Permission::class,
            'subject_id' => $permission->id,
            'old_values' => $oldValues,
            'new_values' => ['name' => $permission->name],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->ok([
            'id' => $permission->id,
            'name' => $permission->name,
            'key' => $permission->name,
            'group' => $this->resolveGroup($permission->name),
            'guard_name' => $permission->guard_name,
            'roles' => $permission->roles()->pluck('name'),
        ], 'Permission updated successfully');
    }

    public function destroy(Request $request, Permission $permission)
    {
        $this->authorize('delete', $permission);

        $oldValues = ['name' => $permission->name];

        $permission->delete();

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'permission.deleted',
            'subject_type' => Permission::class,
            'subject_id' => $permission->id,
            'old_values' => $oldValues,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->ok(null, 'Permission deleted successfully');
    }
}
