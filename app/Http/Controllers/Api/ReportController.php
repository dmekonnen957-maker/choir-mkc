<?php

namespace App\Http\Controllers\Api;

use App\Models\AttendanceRecord;
use App\Models\Choir;
use App\Models\Member;
use App\Models\Performance;
use Illuminate\Http\Request;

class ReportController extends ApiController
{
    public function index(Request $request)
    {
        return $this->ok([
            'available' => ['attendance', 'members', 'performances'],
        ]);
    }

    public function show(Request $request, string $report)
    {
        return match ($report) {
            'attendance' => $this->attendanceReport($request),
            'members' => $this->membersReport($request),
            'performances' => $this->performancesReport($request),
            default => $this->error('Unknown report', null, 404),
        };
    }

    protected function scopeChoir(Request $request)
    {
        if ($request->filled('choir_id')) {
            $choir = Choir::find($request->choir_id);

            if (! $choir) {
                abort(404);
            }

            return (int) $request->choir_id;
        }

        return null;
    }

    protected function attendanceReport(Request $request)
    {
        $choirId = $this->scopeChoir($request);

        $query = AttendanceRecord::query()
            ->when($choirId, fn ($q) => $q->forChoir($choirId));

        $counts = [
            'present' => (clone $query)->present()->count(),
            'absent' => (clone $query)->absent()->count(),
            'late' => (clone $query)->late()->count(),
            'excused' => (clone $query)->excused()->count(),
        ];

        $counts['total'] = $query->count();

        return $this->ok([
            'report' => 'attendance',
            'choir_id' => $choirId,
            'counts' => $counts,
        ]);
    }

    protected function membersReport(Request $request)
    {
        $choirId = $this->scopeChoir($request);

        $query = Member::query()
            ->when($choirId, fn ($q) => $q->forChoir($choirId));

        $byStatus = $query->select('status')
            ->selectRaw('count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $byVoiceSection = $query->select('voice_section_id')
            ->selectRaw('count(*) as total')
            ->groupBy('voice_section_id')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->voice_section_id => $row->total])
            ->toArray();

        return $this->ok([
            'report' => 'members',
            'choir_id' => $choirId,
            'by_status' => $byStatus,
            'by_voice_section' => $byVoiceSection,
            'total' => $query->count(),
        ]);
    }

    protected function performancesReport(Request $request)
    {
        $choirId = $this->scopeChoir($request);

        $query = Performance::query()
            ->when($choirId, fn ($q) => $q->forChoir($choirId));

        $byStatus = $query->select('status')
            ->selectRaw('count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        return $this->ok([
            'report' => 'performances',
            'choir_id' => $choirId,
            'by_status' => $byStatus,
            'total' => $query->count(),
        ]);
    }
}
