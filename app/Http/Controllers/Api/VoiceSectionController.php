<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\VoiceSection\StoreVoiceSectionRequest;
use App\Http\Requests\Api\VoiceSection\UpdateVoiceSectionRequest;
use App\Http\Resources\Api\VoiceSectionResource;
use App\Models\Choir;
use App\Models\VoiceSection;
use Illuminate\Http\Request;

class VoiceSectionController extends ApiController
{
    public function index(Request $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        $this->authorize('viewAny', VoiceSection::class);

        $q = $choir->voiceSections();

        if ($request->filled('search')) {
            $q->where('name', 'like', '%' . $request->input('search') . '%');
        }

        return $this->paginate($q, VoiceSectionResource::class);
    }

    public function show(Request $request, Choir $choir, VoiceSection $voiceSection): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $voiceSection);

        return $this->ok(new VoiceSectionResource($voiceSection));
    }

    public function store(StoreVoiceSectionRequest $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $choir);

        $data = $request->validated();
        $data['choir_id'] = $choir->id;

        $voiceSection = VoiceSection::create($data);

        return $this->ok(new VoiceSectionResource($voiceSection), 'Voice section created', 201);
    }

    public function update(UpdateVoiceSectionRequest $request, Choir $choir, VoiceSection $voiceSection): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $choir);

        $voiceSection->update($request->validated());

        return $this->ok(new VoiceSectionResource($voiceSection), 'Voice section updated');
    }

    public function destroy(Choir $choir, VoiceSection $voiceSection): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $choir);

        $voiceSection->delete();

        return $this->ok(null, 'Voice section deleted');
    }
}
