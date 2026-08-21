<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Contact\StoreContactRequest;
use App\Http\Requests\Api\Contact\UpdateContactRequest;
use App\Models\Choir;
use App\Models\Contact;
use Illuminate\Http\Request;

class ContactController extends ApiController
{
    private function canManage(Request $request): bool
    {
        $user = $request->user();

        if ($user->hasAnyRole(['super-admin', 'admin'])) {
            return true;
        }

        return $user->can('announcements.manage');
    }

    public function index(Request $request, Choir $choir)
    {
        $items = $choir->contacts()->paginate(15);

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

    public function store(StoreContactRequest $request, Choir $choir)
    {
        if (!$this->canManage($request)) {
            return $this->error('Forbidden', null, 403);
        }

        $contact = $choir->contacts()->create([
            'choir_id' => $choir->id,
            ...$request->validated(),
        ]);

        return $this->ok($contact, 'Created', 201);
    }

    public function show(Request $request, Choir $choir, Contact $contact)
    {
        return $this->ok($contact);
    }

    public function update(UpdateContactRequest $request, Choir $choir, Contact $contact)
    {
        if (!$this->canManage($request)) {
            return $this->error('Forbidden', null, 403);
        }

        $contact->update($request->validated());

        return $this->ok($contact);
    }

    public function destroy(Choir $choir, Contact $contact)
    {
        if (!$this->canManage(request())) {
            return $this->error('Forbidden', null, 403);
        }

        $contact->delete();

        return $this->ok(null, 'Deleted');
    }
}
