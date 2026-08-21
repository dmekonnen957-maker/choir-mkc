<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Attendance\StoreAttendanceRecordRequest;
use App\Http\Requests\Api\Attendance\StoreAttendanceSessionRequest;
use App\Http\Requests\Api\Attendance\UpdateAttendanceRecordRequest;
use App\Http\Requests\Api\Attendance\UpdateAttendanceSessionRequest;
use App\Http\Resources\Api\AttendanceRecordResource;
use App\Http\Resources\Api\AttendanceSessionResource;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Choir;
use Illuminate\Http\Request;

class AttendanceController extends ApiController
{
    private function canManage(Request $request): bool
    {
        $user = $request->user();

        return $user->hasAnyRole(['super-admin', 'admin']) || $user->can('rehearsals.manage');
    }

    private function requireManage(Request $request)
    {
        if (! $this->canManage($request)) {
            return $this->error('Forbidden', null, 403);
        }

        return null;
    }

    public function index(Request $request, Choir $choir)
    {
        return $this->paginate($choir->attendanceSessions(), AttendanceSessionResource::class);
    }

    public function store(StoreAttendanceSessionRequest $request, Choir $choir)
    {
        if ($response = $this->requireManage($request)) {
            return $response;
        }

        $session = $choir->attendanceSessions()->create([
            'choir_id' => $choir->id,
            'created_by' => $request->user()->id,
            ...$request->validated(),
        ]);

        return $this->ok(new AttendanceSessionResource($session), 'Created', 201);
    }

    public function show(Request $request, Choir $choir, AttendanceSession $attendanceSession)
    {
        return $this->ok(new AttendanceSessionResource($attendanceSession->load('records.member')));
    }

    public function update(UpdateAttendanceSessionRequest $request, Choir $choir, AttendanceSession $attendanceSession)
    {
        if ($response = $this->requireManage($request)) {
            return $response;
        }

        $attendanceSession->update($request->validated());

        return $this->ok(new AttendanceSessionResource($attendanceSession));
    }

    public function destroy(Choir $choir, AttendanceSession $attendanceSession)
    {
        if ($response = $this->requireManage(request())) {
            return $response;
        }

        $attendanceSession->delete();

        return $this->ok(null, 'Attendance session deleted');
    }

    public function recordsIndex(Request $request, Choir $choir, AttendanceSession $attendanceSession)
    {
        return $this->ok(
            AttendanceRecordResource::collection($attendanceSession->records()->with('member')->get())
        );
    }

    public function recordsStore(StoreAttendanceRecordRequest $request, Choir $choir, AttendanceSession $attendanceSession)
    {
        if ($response = $this->requireManage($request)) {
            return $response;
        }

        $record = $attendanceSession->attendanceRecords()->create([
            'attendance_session_id' => $attendanceSession->id,
            'choir_id' => $choir->id,
            ...$request->validated(),
        ]);

        return $this->ok(new AttendanceRecordResource($record), 'Created', 201);
    }

    public function recordsShow(Request $request, Choir $choir, AttendanceSession $attendanceSession, AttendanceRecord $record)
    {
        return $this->ok(new AttendanceRecordResource($record->load('member')));
    }

    public function recordsUpdate(UpdateAttendanceRecordRequest $request, Choir $choir, AttendanceSession $attendanceSession, AttendanceRecord $record)
    {
        if ($response = $this->requireManage($request)) {
            return $response;
        }

        $record->update($request->validated());

        return $this->ok(new AttendanceRecordResource($record));
    }

    public function recordsDestroy(Choir $choir, AttendanceSession $attendanceSession, AttendanceRecord $record)
    {
        if ($response = $this->requireManage(request())) {
            return $response;
        }

        $record->delete();

        return $this->ok(null, 'Attendance record deleted');
    }
}
