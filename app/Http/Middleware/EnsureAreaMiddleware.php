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
                $role = Role::where('name', $roleName)->where('guard_name', 'api')->first();
                $roleArea = $role?->area;
            }
            
            if ($roleArea && in_array($roleArea, $areas, true)) {
                return $next($request);
            }
        }

        // Also check legacy role column
        $legacyRole = strtolower(trim((string) $user->getAttribute('role')));
        $legacyArea = $coreRoleAreas[$legacyRole] ?? null;
        if ($legacyArea && in_array($legacyArea, $areas, true)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'You do not have permission to access this area.',
            'errors' => null,
        ], 403);
    }
}
