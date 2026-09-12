<?php

namespace App\Http\Controllers\Api;

use App\Models\AttendanceRecord;
use App\Models\AuditLog;
use App\Models\Choir;
use App\Models\Member;
use App\Models\Performance;
use App\Models\Song;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends ApiController
{
    public function index(Request $request)
    {
        $this->authorizeReportAccess($request);
        return $this->ok([
            'available' => ['summary', 'attendance', 'members', 'performances', 'songs', 'activity'],
            'choirs' => $this->allowedChoirs($request->user())->map(fn ($choir) => ['id' => $choir->id, 'name' => $choir->name])->values(),
            'can_export' => $request->user()->isGlobalAdmin() || $request->user()->can('reports.export'),
        ]);
    }

    public function show(Request $request, string $report)
    {
        $this->authorizeReportAccess($request);
        $data = $this->buildReport($request->user(), $this->validatedFilters($request));
        return array_key_exists($report, $data)
            ? $this->ok(['report' => $report, ...$data[$report]])
            : $this->error('Unknown report type.', null, 404);
    }

    public function export(Request $request)
    {
        $this->authorizeReportAccess($request);
        abort_unless($request->user()->isGlobalAdmin() || $request->user()->can('reports.export'), 403, 'You do not have permission to export reports.');
        $filters = $this->validatedFilters($request);
        $data = $this->buildReport($request->user(), $filters);
        $reportType = $filters['report_type'] ?? 'summary';

        $rows = match ($reportType) {
            'members' => collect($data['members']['items'])->map(fn ($item) => [
                $item['name'], $item['choir'], $item['status'], $item['attendance_rate'] . '%', $item['joined_date'],
            ]),
            'performances' => collect($data['performances']['items'])->map(fn ($item) => [
                $item['title'], $item['choir'], $item['date'], $item['location'], $item['status'],
            ]),
            'songs' => collect($data['songs']['items'])->map(fn ($item) => [
                $item['title'], $item['scale'], $item['choir'], $item['created_by'], $item['date'],
            ]),
            'activity' => collect($data['activity']['items'])->map(fn ($item) => [
                $item['user'], $item['action'], $item['module'], $item['date'], $item['time'],
            ]),
            default => collect([
                ['Total Members', $data['summary']['total_members']],
                ['Active Members', $data['summary']['active_members']],
                ['Attendance Rate', $data['summary']['attendance_rate'] . '%'],
                ['Total Performances', $data['summary']['total_performances']],
                ['Total Songs', $data['summary']['total_songs']],
            ]),
        };

        $headers = match ($reportType) {
            'members' => ['Member', 'Choir', 'Status', 'Attendance Rate', 'Joined Date'],
            'performances' => ['Performance', 'Choir', 'Date', 'Location', 'Status'],
            'songs' => ['Song', 'Scale', 'Choir', 'Created By', 'Date'],
            'activity' => ['User', 'Action', 'Module', 'Date', 'Time'],
            default => ['Metric', 'Value'],
        };

        return response()->streamDownload(function () use ($headers, $rows): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers);
            foreach ($rows as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, 'choir-report.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    protected function authorizeReportAccess(Request $request): void
    {
        $user = $request->user();
        abort_unless($user, 401);

        if (! $user->isGlobalAdmin() && ! $user->can('reports.view') && ! $user->hasAnyRole(['team_leader'], 'api')) {
            abort(403, 'You do not have permission to view reports.');
        }
    }

    protected function validatedFilters(Request $request): array
    {
        $validator = Validator::make($request->all(), [
            'choir_id' => ['nullable', 'integer'],
            'range' => ['nullable', 'in:all,today,week,month,year,custom'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'report_type' => ['nullable', 'in:summary,attendance,members,choirs,performances,songs,activity'],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        if ($validator->fails()) {
            abort(response()->json([
                'success' => false,
                'message' => 'Please check the report filters.',
                'errors' => $validator->errors(),
            ], 422));
        }

        $filters = $validator->validated();
        $range = $filters['range'] ?? 'all';
        $today = Carbon::today();

        if ($range !== 'custom') {
            [$from, $to] = match ($range) {
                'today' => [$today->copy(), $today->copy()],
                'week' => [$today->copy()->startOfWeek(), $today->copy()->endOfWeek()],
                'month' => [$today->copy()->startOfMonth(), $today->copy()->endOfMonth()],
                'year' => [$today->copy()->startOfYear(), $today->copy()->endOfYear()],
                default => [null, null],
            };
            $filters['from'] = $from?->toDateString();
            $filters['to'] = $to?->toDateString();
        }

        return ['from' => null, 'to' => null, 'search' => null, 'range' => $range, 'report_type' => 'summary'] + $filters;
    }

    protected function buildReport(User $user, array $filters): array
    {
        $choirs = $this->allowedChoirs($user);
        $choirIds = ! empty($filters['choir_id']) ? collect([(int) $filters['choir_id']]) : $choirs->pluck('id');
        $records = AttendanceRecord::with(['member', 'choir'])->whereIn('choir_id', $choirIds)
            ->when($filters['from'], fn ($query) => $query->whereDate('created_at', '>=', $filters['from']))
            ->when($filters['to'], fn ($query) => $query->whereDate('created_at', '<=', $filters['to']))->get();
        $members = Member::with('choir')->whereIn('choir_id', $choirIds)
            ->when($filters['search'], fn ($query) => $query->where(function ($query) use ($filters) {
                $query->where('first_name', 'like', '%' . $filters['search'] . '%')->orWhere('last_name', 'like', '%' . $filters['search'] . '%');
            }))->get();
        $performances = Performance::with('choir')->whereIn('choir_id', $choirIds)
            ->when($filters['from'], fn ($query) => $query->whereDate('date', '>=', $filters['from']))
            ->when($filters['to'], fn ($query) => $query->whereDate('date', '<=', $filters['to']))->latest('date')->get();
        $songs = Song::with(['choir', 'creator'])->whereIn('choir_id', $choirIds)->latest()->get();
        $activity = AuditLog::with('user')->whereIn('choir_id', $choirIds)->latest('created_at')->limit(50)->get();
        return [
            'summary' => ['total_members' => $members->count(), 'active_members' => $members->where('status', 'active')->count(), 'attendance_rate' => $this->rate($records), 'total_performances' => $performances->count(), 'total_songs' => $songs->count(), 'total_choirs' => $choirIds->count()],
            'attendance' => $this->attendanceData($records, $choirs, $filters['from'], $filters['to']),
            'members' => ['items' => $members->map(fn ($member) => $this->memberRow($member, $records))->values()],
            'performances' => ['items' => $performances->map(fn ($performance) => ['title' => $performance->title, 'choir' => $performance->choir?->name, 'date' => $performance->date?->toDateString(), 'location' => $performance->location ?: $performance->venue, 'status' => $performance->status])->values()],
            'songs' => ['items' => $songs->map(fn ($song) => ['title' => $song->title, 'scale' => $song->scale, 'choir' => $song->choir?->name, 'created_by' => $song->creator?->name, 'date' => $song->created_at?->toDateString()])->values()],
            'activity' => ['items' => $activity->map(fn ($log) => ['user' => $log->user?->name, 'action' => $log->action, 'module' => class_basename((string) $log->subject_type), 'date' => $log->created_at?->toDateString(), 'time' => $log->created_at?->format('H:i')])->values()],
        ];
    }

    protected function attendanceData(Collection $records, Collection $choirs, ?string $from, ?string $to): array
    {
        return ['counts' => ['present' => $records->where('status', 'present')->count(), 'absent' => $records->where('status', 'absent')->count(), 'late' => $records->where('status', 'late')->count(), 'excused' => $records->where('status', 'excused')->count(), 'total' => $records->count()], 'by_choir' => $choirs->map(fn ($choir) => ['name' => $choir->name, 'rate' => $this->rate($records->where('choir_id', $choir->id))])->values(), 'from' => $from, 'to' => $to];
    }

    protected function memberRow($member, Collection $records): array
    {
        $memberRecords = $records->where('member_id', $member->id);
        return ['id' => $member->id, 'name' => $member->full_name, 'choir' => $member->choir?->name, 'status' => $member->status, 'attendance_rate' => $this->rate($memberRecords), 'joined_date' => $member->join_date ? date('Y-m-d', strtotime((string) $member->join_date)) : null];
    }

    protected function rate(Collection $records): float
    {
        if ($records->isEmpty()) return 0;
        return round(($records->whereIn('status', ['present', 'late'])->count() / $records->count()) * 100, 1);
    }

    protected function allowedChoirs(User $user): Collection
    {
        return $user->isGlobalAdmin() ? Choir::query()->orderBy('name')->get() : $user->choirs()->wherePivot('status', 'active')->orderBy('name')->get();
    }

    protected function scopeChoir(Request $request)
    {
        if ($request->filled('choir_id')) {
            abort_unless($this->allowedChoirs($request->user())->contains('id', (int) $request->choir_id), 403, 'You do not have access to this choir.');
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
