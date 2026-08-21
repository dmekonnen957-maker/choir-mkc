<?php

namespace App\Http\Controllers\Api;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends ApiController
{
    public function index(Request $request)
    {
        $query = AuditLog::with(['choir', 'user'])
            ->when($request->action, fn ($q) => $q->where('action', $request->action))
            ->when($request->choir_id, fn ($q) => $q->where('choir_id', $request->choir_id))
            ->latest();

        $items = $query->paginate(20);

        return $this->ok([
            'items' => $items->items(),
            'pagination' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function show(Request $request, AuditLog $auditLog)
    {
        return $this->ok($auditLog->load(['choir', 'user']));
    }
}
