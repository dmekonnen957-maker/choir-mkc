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

        $legacyRole = strtolower(trim((string) $user->getAttribute('role')));
        if (! in_array($legacyRole, ['admin', 'super-admin', 'team_leader'], true)
            && ! $user->hasAnyRole(['admin', 'super-admin', 'team_leader'], 'api')) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to manage attendance.',
                'errors' => null,
            ], 403);
        }

        return $next($request);
    }
}
