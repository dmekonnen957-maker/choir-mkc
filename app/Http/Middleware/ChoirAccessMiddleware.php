<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ChoirAccessMiddleware
{
    /**
     * Ensure the authenticated user is authorized for the targeted choir.
     *
     * Allows access when the user is actively assigned to the choir, or holds a
     * platform-wide administrative role / cross-choir permission.
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

        $choir = $request->route('choir');

        if ($choir) {
            $hasGlobalAccess = $user->hasAnyRole(['super-admin', 'admin'])
                || $user->can('choirs.view.all');

            $isAssigned = $user->choirs()
                ->where('choirs.id', $choir->id)
                ->wherePivot('status', 'active')
                ->exists();

            if (! $hasGlobalAccess && ! $isAssigned) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not authorized to access this choir.',
                    'errors' => null,
                ], 403);
            }
        }

        // Write protection: only leaders/admins may mutate choir data, even when assigned.
        $isWrite = in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true);
        $canModify = $user->hasAnyRole(['super-admin', 'admin', 'team_leader'])
            || $user->can('choirs.manage');

        if ($isWrite && ! $canModify) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to modify this choir.',
                'errors' => null,
            ], 403);
        }

        return $next($request);
    }
}
