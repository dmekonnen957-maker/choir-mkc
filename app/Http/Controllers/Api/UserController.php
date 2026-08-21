<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\User\StoreUserRequest;
use App\Http\Requests\Api\User\UpdateUserRequest;
use App\Http\Resources\Api\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends ApiController
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $query = User::with('roles')->latest();

        return $this->paginate($query, UserResource::class);
    }

    public function store(StoreUserRequest $request)
    {
        $this->authorize('create', User::class);

        $data = $request->validated();
        $data['password'] = bcrypt($data['password']);

        $user = User::create($data);

        if ($request->filled('roles')) {
            $user->assignRole($request->roles);
        }

        return $this->ok(UserResource::make($user->load('roles')), 'Created', 201);
    }

    public function show(Request $request, User $user)
    {
        $this->authorize('view', $user);

        return $this->ok(UserResource::make($user->load('roles')));
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $this->authorize('update', $user);

        $data = $request->validated();

        if (isset($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        if ($request->filled('roles')) {
            $user->syncRoles($request->roles);
        }

        return $this->ok(UserResource::make($user->load('roles')), 'Updated');
    }

    public function destroy(Request $request, User $user)
    {
        $this->authorize('delete', $user);

        if ($request->user()->id === $user->id) {
            return $this->error('Cannot delete yourself', null, 422);
        }

        $user->delete();

        return $this->ok(null, 'Deleted');
    }
}
