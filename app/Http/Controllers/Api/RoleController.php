<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Role\StoreRoleRequest;
use App\Http\Requests\Api\Role\UpdateRoleRequest;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class RoleController extends ApiController
{
    protected function paginated(\Illuminate\Contracts\Pagination\LengthAwarePaginator $items): \Illuminate\Http\JsonResponse
    {
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

    public function index(Request $request)
    {
        $items = Role::with('permissions')->paginate(20);

        return $this->paginated($items);
    }

    public function store(StoreRoleRequest $request)
    {
        $data = $request->validated();

        $role = Role::create([
            'name' => $data['name'],
            'guard_name' => 'web',
        ]);

        if ($request->filled('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return $this->ok($role->load('permissions'), 'Created', 201);
    }

    public function show(Request $request, Role $role)
    {
        return $this->ok($role->load('permissions'));
    }

    public function update(UpdateRoleRequest $request, Role $role)
    {
        $data = $request->validated();

        $role->update([
            'name' => $data['name'],
        ]);

        if ($request->filled('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return $this->ok($role->load('permissions'), 'Updated');
    }

    public function destroy(Request $request, Role $role)
    {
        $role->delete();

        return $this->ok(null, 'Deleted');
    }
}
