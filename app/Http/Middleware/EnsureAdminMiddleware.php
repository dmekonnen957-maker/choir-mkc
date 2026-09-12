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

        $legacyRole = strtolower(trim((string) $user->getAttribute('role')));
        if (! in_array($legacyRole, ['admin', 'super-admin'], true)
            && ! $user->hasAnyRole(['admin', 'super-admin'], 'api')) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to access this area.',
                'errors' => null,
            ], 403);
        }

        return $next($request);
    }
}
