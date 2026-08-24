<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMemberMiddleware
{
    /**
     * Restrict a route group to authenticated MEMBER-role users only.
     *
     * Team Leaders and Admins are denied so the member area cannot be
     * entered by higher-privilege accounts via the UI.
     */
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
            $msg = $user->isPending()
                ? 'Your account is waiting for administrator approval.'
                : 'Your account is not approved to access the member area.';

            return response()->json([
                'success' => false,
                'message' => $msg,
                'errors' => null,
            ], 403);
        }

        if (! $user->hasRole('member', 'api')) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. This area is for choir members only.',
                'errors' => null,
            ], 403);
        }

        return $next($request);
    }
}
