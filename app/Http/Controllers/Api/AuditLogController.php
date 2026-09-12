<?php

namespace App\Http\Controllers\Api;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AuditLogController extends ApiController
{
    public function index(Request $request)
    {
        $query = AuditLog::with(['choir', 'user'])
            ->when($request->filled('action'), fn ($q) => $q->where('action', 'like', '%' . (string) $request->string('action') . '%'))
            ->when($request->filled('user_id'), fn ($q) => $q->where('user_id', $request->integer('user_id')))
            ->when($request->filled('choir_id'), fn ($q) => $q->where('choir_id', $request->integer('choir_id')))
            ->when($request->filled('module'), fn ($q) => $q->where('subject_type', 'like', '%' . $request->string('module') . '%'))
            ->when($request->filled('from'), fn ($q) => $q->whereDate('created_at', '>=', $request->date('from')))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('created_at', '<=', $request->date('to')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = '%' . $request->string('search') . '%';
                $q->where(function ($q) use ($search) {
                    $q->where('action', 'like', $search)
                        ->orWhere('subject_type', 'like', $search)
                        ->orWhereHas('user', fn ($user) => $user->where('name', 'like', $search))
                        ->orWhereHas('choir', fn ($choir) => $choir->where('name', 'like', $search));
                });
            })
            ->latest();

        $items = $query->paginate(min((int) $request->input('per_page', 20), 100));
        $items->getCollection()->transform(function (AuditLog $log) {
            $module = $log->subject_type ? class_basename($log->subject_type) : 'System';
            $action = Str::headline((string) $log->action);

            return [
                'id' => $log->id,
                'user' => $log->user ? ['id' => $log->user->id, 'name' => $log->user->name, 'email' => $log->user->email] : null,
                'action' => $log->action,
                'action_label' => $action,
                'module' => $module,
                'description' => $action . ' ' . Str::lower($module),
                'choir' => $log->choir ? ['id' => $log->choir->id, 'name' => $log->choir->name] : null,
                'subject_id' => $log->subject_id,
                'created_at' => $log->created_at,
            ];
        });

        return $this->ok([
            'items' => $items->items(),
            'pagination' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
                'links' => $items->linkCollection()->toArray(),
            ],
        ]);
    }

    public function show(Request $request, AuditLog $auditLog)
    {
        return $this->ok($auditLog->load(['choir', 'user']));
    }
}
