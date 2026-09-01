<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Models\Choir;
use App\Models\Performance;
use App\Models\Rehearsal;
use App\Models\Song;
use Illuminate\Http\Request;

class CalendarController extends ApiController
{
    /* ──────────────────────────────────────────────────────────────────
     | ADMIN CALENDAR
     | GET /api/admin/calendar
     | Query params:
     |   choir_id (optional) — filter to a specific choir
     |   type     (optional) — "performance" | "rehearsal"
     |   month    (optional) — "YYYY-MM"  filter to a specific month
     | ─────────────────────────────────────────────────────────────────*/
    public function adminCalendar(Request $request): \Illuminate\Http\JsonResponse
    {
        $choirId = $request->query('choir_id');
        $type    = $request->query('type');       // performance | rehearsal
        $month   = $request->query('month');      // YYYY-MM

        [$startDate, $endDate] = $this->monthBounds($month);

        $events = collect();

        // ── Performances ───────────────────────────────────────────────
        if (! $type || $type === 'performance') {
            $query = Performance::with(['choir:id,name', 'songs' => function ($q) {
                $q->withTrashed()->orderBy('performance_songs.sequence_number');
            }]);

            if ($choirId) {
                $query->where('choir_id', $choirId);
            }
            if ($startDate) {
                $query->whereBetween('date', [$startDate, $endDate]);
            }

            $query->orderBy('date')->orderBy('start_time');

            $events = $events->merge(
                $query->get()->map(fn ($p) => $this->formatPerformance($p))
            );
        }

        // ── Rehearsals ─────────────────────────────────────────────────
        if (! $type || $type === 'rehearsal') {
            $query = Rehearsal::with(['choir:id,name', 'songs']);

            if ($choirId) {
                $query->where('choir_id', $choirId);
            }
            if ($startDate) {
                $query->whereBetween('date', [$startDate, $endDate]);
            }

            $query->orderBy('date')->orderBy('start_time');

            $events = $events->merge(
                $query->get()->map(fn ($r) => $this->formatRehearsal($r))
            );
        }

        // Sort merged results by date + start_time
        $sorted = $events->sortBy(['date', 'start_time'])->values();

        // Choirs list for filter dropdown
        $choirs = Choir::select('id', 'name')->whereNull('deleted_at')->orderBy('name')->get();

        return $this->ok([
            'events' => $sorted,
            'choirs' => $choirs,
        ]);
    }

    /* ──────────────────────────────────────────────────────────────────
     | TEAM LEADER CALENDAR
     | GET /api/team-leader/calendar
     | Team leader sees only events for their assigned choir.
     | Choir derived from the user's choir pivot (is_primary_leader or first).
     | ─────────────────────────────────────────────────────────────────*/
    public function teamLeaderCalendar(Request $request): \Illuminate\Http\JsonResponse
    {
        $user  = $request->user();
        $type  = $request->query('type');
        $month = $request->query('month');

        [$startDate, $endDate] = $this->monthBounds($month);

        // Derive the choir the team leader manages
        $choir = $user->choirs()
            ->wherePivot('is_primary_leader', true)
            ->first()
            ?? $user->choirs()->first();

        if (! $choir) {
            return $this->ok(['events' => [], 'choir' => null]);
        }

        $events = collect();

        if (! $type || $type === 'performance') {
            $query = $choir->performances()
                ->with(['choir:id,name', 'songs' => function ($q) {
                    $q->withTrashed()->orderBy('performance_songs.sequence_number');
                }]);
            if ($startDate) {
                $query->whereBetween('date', [$startDate, $endDate]);
            }
            $query->orderBy('date')->orderBy('start_time');
            $events = $events->merge($query->get()->map(fn ($p) => $this->formatPerformance($p)));
        }

        if (! $type || $type === 'rehearsal') {
            $query = $choir->rehearsals()->with(['choir:id,name', 'songs']);
            if ($startDate) {
                $query->whereBetween('date', [$startDate, $endDate]);
            }
            $query->orderBy('date')->orderBy('start_time');
            $events = $events->merge($query->get()->map(fn ($r) => $this->formatRehearsal($r)));
        }

        $sorted = $events->sortBy(['date', 'start_time'])->values();

        return $this->ok([
            'events' => $sorted,
            'choir'  => ['id' => $choir->id, 'name' => $choir->name],
        ]);
    }

    /* ──────────────────────────────────────────────────────────────────
     | Helpers
     | ─────────────────────────────────────────────────────────────────*/
    private function monthBounds(?string $month): array
    {
        if (! $month || ! preg_match('/^\d{4}-\d{2}$/', $month)) {
            return [null, null];
        }
        $start = \Carbon\Carbon::createFromFormat('Y-m', $month)->startOfMonth()->toDateString();
        $end   = \Carbon\Carbon::createFromFormat('Y-m', $month)->endOfMonth()->toDateString();
        return [$start, $end];
    }

    private function formatPerformance(Performance $p): array
    {
        return [
            'id'          => $p->id,
            'type'        => 'performance',
            'title'       => $p->title,
            'date'        => $p->date ? $p->date->format('Y-m-d') : null,
            'start_time'  => $p->start_time,
            'end_time'    => $p->end_time,
            'venue'       => $p->venue,
            'location'    => $p->location ?? $p->venue,
            'description' => $p->description,
            'status'      => $p->status,
            'is_public'   => $p->is_public,
            'choir'       => $p->choir ? ['id' => $p->choir->id, 'name' => $p->choir->name] : null,
            'songs'       => $p->songs->map(fn ($s) => [
                'id'         => $s->id,
                'title'      => $s->title,
                'artist'     => $s->artist,
                'has_lyrics' => (bool) $s->lyrics,
                'lyrics'     => $s->lyrics,
            ])->values(),
        ];
    }

    private function formatRehearsal(Rehearsal $r): array
    {
        return [
            'id'          => $r->id,
            'type'        => 'rehearsal',
            'title'       => $r->title,
            'date'        => $r->date ? $r->date->format('Y-m-d') : null,
            'start_time'  => $r->start_time,
            'end_time'    => $r->end_time,
            'venue'       => null,
            'location'    => $r->location,
            'description' => $r->description,
            'status'      => $r->status,
            'is_public'   => false,
            'choir'       => $r->choir ? ['id' => $r->choir->id, 'name' => $r->choir->name] : null,
            'songs'       => $r->songs->map(fn ($s) => [
                'id'         => $s->id,
                'title'      => $s->title,
                'artist'     => $s->artist,
                'has_lyrics' => (bool) $s->lyrics,
                'lyrics'     => $s->lyrics,
            ])->values(),
        ];
    }
}
