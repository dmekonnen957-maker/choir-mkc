<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Member\StoreMemberRequest;
use App\Http\Requests\Api\Member\UpdateMemberRequest;
use App\Http\Resources\Api\MemberResource;
use App\Models\Choir;
use App\Models\Member;
use Illuminate\Http\Request;

class MemberController extends ApiController
{
    public function index(Request $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        $this->authorize('viewAny', Member::class);

        $q = $choir->members();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $q->where(function ($query) use ($search) {
                $query->where('first_name', 'like', '%' . $search . '%')
                    ->orWhere('last_name', 'like', '%' . $search . '%')
                    ->orWhere('member_code', 'like', '%' . $search . '%');
            });
        }

        return $this->paginate($q->with('voiceSection'), MemberResource::class);
    }

    public function store(StoreMemberRequest $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        $this->authorize('create', Member::class);

        $data = $request->validated();
        $data['choir_id'] = $choir->id;

        $member = Member::create($data);

        return $this->ok(new MemberResource($member), 'Member created', 201);
    }

    public function show(Request $request, Choir $choir, Member $member): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $member);

        return $this->ok(new MemberResource($member->load('voiceSection')));
    }

    public function update(UpdateMemberRequest $request, Choir $choir, Member $member): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $member);

        $member->update($request->validated());

        return $this->ok(new MemberResource($member), 'Member updated');
    }

    public function destroy(Choir $choir, Member $member): \Illuminate\Http\JsonResponse
    {
        $this->authorize('delete', $member);

        $member->delete();

        return $this->ok(null, 'Member deleted');
    }
}
