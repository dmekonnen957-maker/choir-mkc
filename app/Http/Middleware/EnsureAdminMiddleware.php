<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
                'errors' => null,
            ], 401);
        }

        if (! $user->isApproved()) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is waiting for administrator approval.',
                'errors' => null,
            ], 403);
        }

        if ($user->isGlobalAdmin()) {
            return $next($request);
        }

        // Check if user has any role configured with area 'admin'
        $hasAdminArea = $user->roles()->where('area', 'admin')->exists();
        if ($hasAdminArea) {
            return $next($request);
        }

        // Check if user has any admin-level management permissions
        $adminPermissions = [
            'users.view', 'users.view.all', 'users.manage',
            'roles.view', 'roles.manage',
            'permissions.view', 'permissions.manage',
            'choirs.view', 'choirs.view.all', 'choirs.manage', 'choirs.create', 'choirs.delete',
            'members.view', 'members.view.all', 'members.manage',
            'songs.view', 'songs.view.all', 'songs.manage', 'songs.create', 'songs.edit', 'songs.update', 'songs.delete',
            'rehearsals.view', 'rehearsals.view.all', 'rehearsals.manage',
            'performances.view', 'performances.view.all', 'performances.manage',
            'attendance.view', 'attendance.manage',
            'audit_logs.view',
            'reports.view', 'reports.export',
            'settings.manage',
        ];

        foreach ($adminPermissions as $perm) {
            try {
                if ($user->hasPermissionTo($perm, 'api') || $user->can($perm)) {
                    return $next($request);
                }
            } catch (\Throwable) {
                // Ignore guard mismatches
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'You do not have permission to access this area.',
            'errors' => null,
        ], 403);
    }
}
