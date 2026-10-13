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

        // Platform-wide admin area: global admins, roles with area 'admin',
        // legacy roles/direct grants whose permissions imply admin.
        if ($user->isAdminArea()) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'You do not have permission to access this area.',
            'errors' => null,
        ], 403);
    }
}