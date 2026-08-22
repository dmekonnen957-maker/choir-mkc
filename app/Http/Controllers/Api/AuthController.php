<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Auth\LoginRequest;
use App\Http\Requests\Api\Auth\RegisterRequest;
use App\Http\Resources\Api\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends ApiController
{
    public function login(LoginRequest $request): \Illuminate\Http\JsonResponse
    {
        $user = \App\Models\User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return $this->error('Invalid credentials', null, 401);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return $this->ok([
            'token' => $token,
            'user' => new UserResource($user->load('roles', 'permissions', 'choirs')),
        ], 'Login successful');
    }

    public function register(RegisterRequest $request): \Illuminate\Http\JsonResponse
    {
        $user = \App\Models\User::create([
            'name' => trim($request->first_name.' '.$request->last_name),
            'email' => $request->email,
            'password' => $request->password,
            'role' => 'member',
        ]);

        try {
            $role = \Spatie\Permission\Models\Role::findByName('member', 'api');
            $user->assignRole($role);
        } catch (\Throwable) {
            // Role not seeded yet; account is still created without a role.
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return $this->ok([
            'token' => $token,
            'user' => new UserResource($user->load('roles', 'permissions')),
        ], 'Account created successfully', 201);
    }

    public function logout(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->ok(null, 'Logged out successfully');
    }

    public function me(Request $request): \Illuminate\Http\JsonResponse
    {
        return $this->ok(new UserResource($request->user()->load('roles', 'permissions', 'choirs')));
    }
}
