<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Auth\LoginRequest;
use App\Http\Requests\Api\Auth\RegisterRequest;
use App\Http\Resources\Api\UserResource;
use App\Models\Choir;
use App\Models\Member;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class AuthController extends ApiController
{
    public function login(LoginRequest $request): \Illuminate\Http\JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return $this->error('Invalid email or password.', null, 401);
        }

        // Check account approval status
        if ($user->status === User::STATUS_PENDING) {
            return $this->error(
                'Your account is waiting for administrator approval.',
                ['status' => 'pending'],
                403
            );
        }

        if ($user->status === User::STATUS_REJECTED) {
            $reason = $user->rejection_reason
                ? 'Your registration was not approved: ' . $user->rejection_reason
                : 'Your registration was not approved. Please contact the administrator.';

            return $this->error(
                $reason,
                ['status' => 'rejected', 'rejection_reason' => $user->rejection_reason],
                403
            );
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return $this->ok([
            'token' => $token,
            'user' => new UserResource($user->load('roles', 'permissions', 'choirs', 'approvedBy')),
        ], 'Login successful');
    }

    public function register(RegisterRequest $request): \Illuminate\Http\JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $name = $request->filled('name')
                ? trim($request->name)
                : trim($request->first_name . ' ' . $request->last_name);

            if (empty($name)) {
                $name = $request->email;
            }

            // Always enforce role = member and status = pending
            $user = User::create([
                'name' => $name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => $request->password,
                'role' => 'member',
                'status' => User::STATUS_PENDING,
            ]);

            try {
                $role = Role::findByName('member', 'api');
                $user->assignRole($role);
            } catch (\Throwable) {
                // In case role is not seeded yet
            }

            // Attach user to selected choir
            $choirId = $request->choir_id;
            $choir = Choir::find($choirId);

            if ($choir) {
                $user->choirs()->sync([
                    $choir->id => [
                        'is_primary_leader' => false,
                        'status' => 'active',
                    ],
                ]);

                // Create or link Member profile record
                $nameParts = explode(' ', $name, 2);
                $firstName = $nameParts[0] ?? $name;
                $lastName = $nameParts[1] ?? '';

                $codePrefix = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $choir->name ?? 'CHOIR'), 0, 3));
                $memberCode = $codePrefix . '-' . str_pad((string)$user->id, 4, '0', STR_PAD_LEFT);

                Member::updateOrCreate(
                    ['user_id' => $user->id, 'choir_id' => $choir->id],
                    [
                        'member_code' => $memberCode,
                        'first_name' => $request->first_name ?: $firstName,
                        'last_name' => $request->last_name ?: $lastName,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'status' => 'active',
                        'join_date' => now(),
                    ]
                );
            }

            return $this->ok([
                'user' => new UserResource($user->load('roles', 'permissions', 'choirs')),
                'status' => 'pending',
            ], 'Registration submitted successfully. Your account is waiting for administrator approval.', 201);
        });
    }

    public function logout(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->ok(null, 'Logged out successfully');
    }

    public function me(Request $request): \Illuminate\Http\JsonResponse
    {
        return $this->ok(new UserResource($request->user()->load('roles', 'permissions', 'choirs', 'approvedBy')));
    }
}
