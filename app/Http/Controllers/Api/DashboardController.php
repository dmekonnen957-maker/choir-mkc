<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\Api\ChoirResource;
use App\Http\Resources\Api\PerformanceResource;
use App\Models\Announcement;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\AuditLog;
use App\Models\Choir;
use App\Models\GalleryItem;
use App\Models\Lyric;
use App\Models\Member;
use App\Models\Performance;
use App\Models\Rehearsal;
use App\Models\Song;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends ApiController
{
    public function summary(Request $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        $records = AttendanceRecord::where('choir_id', $choir->id)->get();
        $pres = $records->where('status', 'present')->count();
        $lat = $records->where('status', 'late')->count();
        $tot = $records->count();
        $rate = $tot > 0 ? round((($pres + $lat) / $tot) * 100, 1) : 0;

        return $this->ok([
            'counts' => [
                'members' => $choir->members()->where('status', 'active')->count(),
                'songs' => $choir->songs()->count(),
                'rehearsals' => $choir->rehearsals()->count(),
                'performances' => $choir->performances()->count(),
                'announcements' => $choir->announcements()->count(),
                'gallery' => $choir->galleryItems()->count(),
                'attendance_rate' => $rate,
            ],
            'recent_members' => $choir->members()->where('status', 'active')->latest()->take(5)->get()->map(function ($m) {
                return [
                    'id' => $m->id,
                    'name' => $m->full_name,
                    'email' => $m->email,
                    'role_title' => $m->role_title,
                ];
            }),
            'upcoming_performances' => PerformanceResource::collection(
                $choir->performances()
                    ->where('date', '>=', now()->toDateString())
                    ->orderBy('date')
                    ->take(5)
                    ->get()
            ),
        ]);
    }

    public function overview(Request $request): \Illuminate\Http\JsonResponse
    {
        $choirs = Choir::query()
            ->withCount([
                'members' => fn ($q) => $q->where('status', 'active'),
                'songs',
                'performances',
                'rehearsals',
            ])
            ->where('status', 'active')
            ->orderBy('name')
            ->get()
            ->map(function (Choir $choir) {
                return [
                    'id' => $choir->id,
                    'name' => $choir->name,
                    'slug' => $choir->slug,
                    'status' => $choir->status,
                    'theme_color' => $choir->theme_color ?? '#2563eb',
                    'member_count' => $choir->members_count,
                    'songs_count' => $choir->songs_count,
                    'performances_count' => $choir->performances_count,
                    'rehearsals_count' => $choir->rehearsals_count,
                ];
            });

        $totalMembers = Member::where('status', 'active')->count();
        $totalSongs = Song::count();
        $totalPerformances = Performance::count();
        $upcomingPerformancesCount = Performance::where('date', '>=', now()->toDateString())->count();
        $totalRehearsals = Rehearsal::count();
        $totalChoirs = Choir::count();

        // Overall Attendance Calculations
        $totalRecords = AttendanceRecord::count();
        $presentRecords = AttendanceRecord::whereIn('status', ['present', 'late'])->count();
        $attendanceRate = $totalRecords > 0 ? round(($presentRecords / $totalRecords) * 100, 1) : 0;

        $attendanceOverview = [
            'present' => AttendanceRecord::where('status', 'present')->count(),
            'late' => AttendanceRecord::where('status', 'late')->count(),
            'absent' => AttendanceRecord::where('status', 'absent')->count(),
            'excused' => AttendanceRecord::where('status', 'excused')->count(),
            'total' => $totalRecords,
            'attendance_rate' => $attendanceRate,
        ];

        // Members by Choir
        $membersByChoir = $choirs->map(fn ($c) => [
            'id' => $c['id'],
            'name' => $c['name'],
            'count' => (int) $c['member_count'],
            'theme_color' => $c['theme_color'],
        ])->values();

        // Songs by Choir
        $songsByChoir = $choirs->map(fn ($c) => [
            'id' => $c['id'],
            'name' => $c['name'],
            'count' => (int) $c['songs_count'],
        ])->values();

        // Performances over time (group by month)
        $performancesByMonth = Performance::query()
            ->selectRaw("DATE_FORMAT(date, '%Y-%m') as ym, COUNT(*) as count")
            ->whereNotNull('date')
            ->groupBy('ym')
            ->orderBy('ym', 'desc')
            ->take(6)
            ->get()
            ->reverse()
            ->values()
            ->map(function ($row) {
                $ts = strtotime($row->ym . '-01');
                return [
                    'month' => date('M Y', $ts),
                    'shortMonth' => date('M', $ts),
                    'count' => (int) $row->count,
                ];
            });

        // Fallback months if database has few records
        if ($performancesByMonth->isEmpty()) {
            for ($i = 5; $i >= 0; $i--) {
                $ts = strtotime("-{$i} months");
                $performancesByMonth->push([
                    'month' => date('M Y', $ts),
                    'shortMonth' => date('M', $ts),
                    'count' => 0,
                ]);
            }
        }

        $upcoming = Performance::query()
            ->with(['choir:id,name', 'choir.teamLeader:id,name'])
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->orderBy('start_time')
            ->take(6)
            ->get();

        $recentActivity = AuditLog::query()
            ->with('user:id,name')
            ->latest()
            ->take(8)
            ->get()
            ->map(function (AuditLog $log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'user_name' => $log->user?->name ?? 'System',
                    'created_at' => $log->created_at?->toIso8601String(),
                ];
            });

        return $this->ok([
            'counts' => [
                'choirs' => $totalChoirs,
                'members' => $totalMembers,
                'songs' => $totalSongs,
                'rehearsals' => $totalRehearsals,
                'performances' => $totalPerformances,
                'upcoming_performances' => $upcomingPerformancesCount,
                'attendance_rate' => $attendanceRate,
            ],
            'charts' => [
                'members_by_choir' => $membersByChoir,
                'songs_by_choir' => $songsByChoir,
                'attendance_overview' => $attendanceOverview,
                'performances_over_time' => $performancesByMonth,
            ],
            'choirs_overview' => $choirs,
            'upcoming_performances' => PerformanceResource::collection($upcoming),
            'recent_activity' => $recentActivity,
        ]);
    }

    /**
     * Per-choir dashboard stats for admin when a specific choir is selected.
     * GET /api/admin/dashboard/{choir}
     */
    public function choirOverview(Request $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $choir);

        $upcoming = Performance::where('choir_id', $choir->id)
            ->where('date', '>=', now()->toDateString())
            ->with(['choir:id,name', 'choir.teamLeader:id,name'])
            ->orderBy('date')
            ->orderBy('start_time')
            ->take(6)
            ->get();

        $upcomingRehearsals = Rehearsal::where('choir_id', $choir->id)
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->orderBy('start_time')
            ->take(6)
            ->get();

        $recentActivity = AuditLog::where('choir_id', $choir->id)
            ->with('user:id,name')
            ->latest()
            ->take(8)
            ->get()
            ->map(function (AuditLog $log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'user_name' => $log->user?->name ?? 'System',
                    'created_at' => $log->created_at?->toIso8601String(),
                ];
            });

        $records = AttendanceRecord::where('choir_id', $choir->id)->get();
        $pres = $records->where('status', 'present')->count();
        $lat = $records->where('status', 'late')->count();
        $abs = $records->where('status', 'absent')->count();
        $exc = $records->where('status', 'excused')->count();
        $tot = $records->count();
        $rate = $tot > 0 ? round((($pres + $lat) / $tot) * 100, 1) : 0;

        $attendanceOverview = [
            'present' => $pres,
            'late' => $lat,
            'absent' => $abs,
            'excused' => $exc,
            'total' => $tot,
            'attendance_rate' => $rate,
        ];

        // Monthly performance history
        $performancesByMonth = Performance::where('choir_id', $choir->id)
            ->selectRaw("DATE_FORMAT(date, '%Y-%m') as ym, COUNT(*) as count")
            ->whereNotNull('date')
            ->groupBy('ym')
            ->orderBy('ym', 'desc')
            ->take(6)
            ->get()
            ->reverse()
            ->values()
            ->map(function ($row) {
                $ts = strtotime($row->ym . '-01');
                return [
                    'month' => date('M Y', $ts),
                    'shortMonth' => date('M', $ts),
                    'count' => (int) $row->count,
                ];
            });

        return $this->ok([
            'choir' => new ChoirResource($choir),
            'counts' => [
                'members'      => $choir->members()->where('status', 'active')->count(),
                'songs'        => $choir->songs()->count(),
                'performances' => $choir->performances()->count(),
                'upcoming'     => $choir->performances()->where('date', '>=', now()->toDateString())->count(),
                'rehearsals'   => $choir->rehearsals()->count(),
                'attendance_rate' => $rate,
            ],
            'charts' => [
                'attendance_overview' => $attendanceOverview,
                'performances_over_time' => $performancesByMonth,
            ],
            'upcoming_performances' => PerformanceResource::collection($upcoming),
            'upcoming_rehearsals' => $upcomingRehearsals->map(fn ($r) => [
                'id' => $r->id,
                'title' => $r->title,
                'date' => $r->date?->format('Y-m-d'),
                'start_time' => $r->start_time,
                'end_time' => $r->end_time,
                'location' => $r->location,
                'status' => $r->status,
            ]),
            'recent_activity' => $recentActivity,
        ]);
    }

    /**
     * Team leader dashboard endpoint.
     * GET /api/team-leader/dashboard
     */
    public function teamLeaderDashboard(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $choir = $user->choirs()->wherePivot('status', 'active')->first()
            ?? $user->choirs()->first()
            ?? Choir::where('team_leader_id', $user->id)->first();

        if (! $choir) {
            return $this->ok([
                'has_choir' => false,
                'choir' => null,
                'stats' => [
                    'members' => 0,
                    'songs' => 0,
                    'upcoming_performances' => 0,
                    'upcoming_rehearsals' => 0,
                    'attendance' => [
                        'present' => 0,
                        'absent' => 0,
                        'late' => 0,
                        'excused' => 0,
                        'total' => 0,
                        'attendance_rate' => 0,
                        'has_records' => false,
                    ],
                ],
                'next_performance' => null,
                'next_rehearsal' => null,
                'upcoming_performances' => [],
                'upcoming_rehearsals' => [],
                'recent_songs' => [],
            ]);
        }

        $membersCount = $choir->members()->where('status', 'active')->count();
        $songsCount = $choir->songs()->count();
        $upcomingPerformancesCount = $choir->performances()->where('date', '>=', now()->toDateString())->count();
        $upcomingRehearsalsCount = $choir->rehearsals()->where('date', '>=', now()->toDateString())->count();

        $nextPerformance = $choir->performances()
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->orderBy('start_time')
            ->first();

        $nextRehearsal = $choir->rehearsals()
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->orderBy('start_time')
            ->first();

        $records = AttendanceRecord::where('choir_id', $choir->id)->get();
        $pres = $records->where('status', 'present')->count();
        $lat = $records->where('status', 'late')->count();
        $abs = $records->where('status', 'absent')->count();
        $exc = $records->where('status', 'excused')->count();
        $tot = $records->count();
        $rate = $tot > 0 ? round((($pres + $lat) / $tot) * 100, 1) : 0;

        $upcomingPerformances = $choir->performances()
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->take(5)
            ->get();

        $upcomingRehearsals = $choir->rehearsals()
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->take(5)
            ->get();

        $recentSongs = $choir->songs()
            ->latest()
            ->take(5)
            ->get();

        return $this->ok([
            'has_choir' => true,
            'choir' => new ChoirResource($choir),
            'stats' => [
                'members' => $membersCount,
                'songs' => $songsCount,
                'upcoming_performances' => $upcomingPerformancesCount,
                'upcoming_rehearsals' => $upcomingRehearsalsCount,
                'attendance' => [
                    'present' => $pres,
                    'late' => $lat,
                    'absent' => $abs,
                    'excused' => $exc,
                    'total' => $tot,
                    'attendance_rate' => $rate,
                    'has_records' => $tot > 0,
                ],
            ],
            'next_performance' => $nextPerformance ? [
                'id' => $nextPerformance->id,
                'title' => $nextPerformance->title,
                'date' => $nextPerformance->date?->format('Y-m-d'),
                'start_time' => $nextPerformance->start_time,
                'end_time' => $nextPerformance->end_time,
                'location' => $nextPerformance->location ?? $nextPerformance->venue,
            ] : null,
            'next_rehearsal' => $nextRehearsal ? [
                'id' => $nextRehearsal->id,
                'title' => $nextRehearsal->title,
                'date' => $nextRehearsal->date?->format('Y-m-d'),
                'start_time' => $nextRehearsal->start_time,
                'end_time' => $nextRehearsal->end_time,
                'location' => $nextRehearsal->location,
                'status' => $nextRehearsal->status,
            ] : null,
            'upcoming_performances' => PerformanceResource::collection($upcomingPerformances),
            'upcoming_rehearsals' => $upcomingRehearsals->map(fn ($r) => [
                'id' => $r->id,
                'title' => $r->title,
                'date' => $r->date?->format('Y-m-d'),
                'start_time' => $r->start_time,
                'end_time' => $r->end_time,
                'location' => $r->location,
                'status' => $r->status,
            ]),
            'recent_songs' => $recentSongs->map(fn ($s) => [
                'id' => $s->id,
                'title' => $s->title,
                'artist' => $s->artist,
                'category' => $s->category?->name,
                'key' => $s->key,
            ]),
        ]);
    }
}
