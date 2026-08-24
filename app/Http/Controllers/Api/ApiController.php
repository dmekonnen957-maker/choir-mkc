<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;

class ApiController extends Controller
{
    use AuthorizesRequests;

    protected function ok($data = null, string $message = 'Operation completed successfully.', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    protected function error(string $message, $errors = null, int $status = 422): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }

    protected function paginate($query, string $resourceClass, int $defaultPerPage = 15, int $maxPerPage = 100): JsonResponse
    {
        $perPage = (int) request()->input('per_page', $defaultPerPage);
        $perPage = max(1, min($perPage, $maxPerPage));

        $items = $query->paginate($perPage);

        $data = $resourceClass::collection($items)->response()->getData(true);

        return $this->ok([
            'items' => $data['data'] ?? [],
            'pagination' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    /**
     * Resolve the choir the request is scoped to (route bound).
     */
    protected function currentChoir()
    {
        return request()->route('choir');
    }
}
