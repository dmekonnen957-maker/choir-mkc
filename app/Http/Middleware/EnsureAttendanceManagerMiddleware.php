<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAttendanceManagerMiddleware
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

        // Global admins, legacy team_leader column, any role declaring an
        // admin/team_leader area, or an explicit attendance/rehearsal
        // management permission. Custom granted roles are honored.
        $legacyRole = strtolower(trim((string) $user->getAttribute('role')));
        $allowed = $user->isGlobalAdmin()
            || $legacyRole === 'team_leader'
            || $user->roles()->whereIn('area', ['admin', 'team_leader'])->exists()
            || $user->can('attendance.manage')
            || $user->can('rehearsals.manage')
            || $user->can('attendance.view.all');

        if (! $allowed) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to manage attendance.',
                'errors' => null,
            ], 403);
        }

        return $next($request);
    }
}