<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\Response;

class EnsureAreaMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     * @param  string  ...$areas  Allowed areas (admin, team_leader, member, musician)
     */
    public function handle(Request $request, Closure $next, ...$areas): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
                'errors' => null,
            ], 401);
        }

        // Global admins always have access
        if ($user->isGlobalAdmin()) {
            return $next($request);
        }

        // Normalize requested allowed areas
        $normalizedAreas = array_map(function ($a) {
            $a = str_replace('-', '_', strtolower(trim($a)));
            return $a === 'musicians' ? 'musician' : $a;
        }, $areas);

        // Check if user has any role with an allowed area
        $userRoleNames = $user->getRoleNames()->toArray();
        
        // Check direct role names for core roles
        $coreRoleAreas = [
            'super-admin' => 'admin',
            'admin' => 'admin',
            'team_leader' => 'team_leader',
            'team-leader' => 'team_leader',
            'member' => 'member',
            'musician' => 'musician',
            'musicians' => 'musician',
        ];

        foreach ($userRoleNames as $roleName) {
            $roleArea = $coreRoleAreas[$roleName] ?? null;
            
            // If not a core role, check the role's area field
            if (! $roleArea) {
                $role = Role::where('name', $roleName)->where('guard_name', 'api')->with('permissions')->first();
                $roleArea = $role?->area;
                if (! $roleArea && $role) {
                    $perms = $role->permissions->pluck('name')->toArray();
                    foreach ($perms as $p) {
                        if (str_starts_with($p, 'users.') || str_starts_with($p, 'roles.') || str_starts_with($p, 'permissions.') || str_starts_with($p, 'audit_logs.') || str_starts_with($p, 'reports.') || str_starts_with($p, 'settings.') || $p === 'choirs.create' || $p === 'choirs.delete') {
                            $roleArea = 'admin';
                            break;
                        }
                    }
                }
            }

            if ($roleArea) {
                $roleArea = str_replace('-', '_', strtolower(trim($roleArea)));
                if ($roleArea === 'musicians') {
                    $roleArea = 'musician';
                }
            }
            
            if ($roleArea && in_array($roleArea, $normalizedAreas, true)) {
                return $next($request);
            }
        }

        // Also check legacy role column
        $legacyRole = strtolower(trim((string) $user->getAttribute('role')));
        $legacyArea = $coreRoleAreas[$legacyRole] ?? $legacyRole;
        $legacyArea = str_replace('-', '_', $legacyArea);
        if ($legacyArea && in_array($legacyArea, $normalizedAreas, true)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'You do not have permission to access this area.',
            'errors' => null,
        ], 403);
    }
}
