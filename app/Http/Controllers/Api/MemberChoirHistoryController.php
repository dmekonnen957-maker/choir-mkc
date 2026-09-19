<?php

namespace App\Http\Controllers\Api;

use App\Models\Choir;
use App\Models\GalleryItem;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;

class MemberChoirHistoryController extends ApiController
{
    private function choirFor(User $user): ?Choir
    {
        return $user->choirs()
            ->wherePivot('status', 'active')
            ->first()
            ?? $user->choirs()->first();
    }

    private function canView(User $user, Choir $choir): bool
    {
        return $user->isGlobalAdmin()
            || $user->can('choirs.view.all')
            || $user->can('gallery.view.all')
            || $user->choirs()->where('choirs.id', $choir->id)->wherePivot('status', 'active')->exists();
    }

    private function canManage(User $user): bool
    {
        return $user->isGlobalAdmin() || $user->can('gallery.manage');
    }

    private function authorizedChoir(Request $request, bool $manage = false): Choir
    {
        $user = $request->user();

        abort_unless($user && $user->isApproved(), 403, 'Your account is not approved to access choir history.');

        // Global admins or users with choir/gallery permissions can view any choir even if they are not members of one.
        if ($user->isGlobalAdmin() || $user->can('choirs.view.all') || $user->can('gallery.view.all')) {
            // Allow selecting a specific choir via query parameter for admins
            if ($request->has('choir_id')) {
                $choir = Choir::find($request->integer('choir_id'));
                abort_unless($choir, 404, 'Selected choir not found.');
            } else {
                $choir = $this->choirFor($user) ?? Choir::first();
            }
            abort_unless($choir, 404, 'No choir has been created yet.');

            if ($manage) {
                abort_unless($this->canManage($user), 403, 'You do not have permission to manage choir history.');
            }

            return $choir;
        }

        $choir = $this->choirFor($user) ?? Choir::first();
        abort_unless($choir && $this->canView($user, $choir), 403, 'You are not authorized to view this choir history.');

        if ($manage) {
            abort_unless($this->canManage($user), 403, 'You do not have permission to manage choir history.');
        }

        return $choir;
    }

    public function show(Request $request): JsonResponse
    {
        $choir = $this->authorizedChoir($request);

        $events = $choir->performances()
            ->where('date', '<', now()->toDateString())
            ->orderByDesc('date')
            ->take(12)
            ->get(['id', 'title', 'date', 'venue', 'location', 'description'])
            ->map(fn ($event) => [
                'id' => $event->id,
                'title' => $event->title,
                'date' => $event->date?->format('Y-m-d'),
                'location' => $event->venue ?: $event->location,
                'description' => $event->description,
                'type' => 'performance',
            ]);

        $rehearsals = $choir->rehearsals()
            ->where('date', '<', now()->toDateString())
            ->orderByDesc('date')
            ->take(12)
            ->get(['id', 'title', 'date', 'location', 'description'])
            ->map(fn ($event) => [
                'id' => $event->id,
                'title' => $event->title,
                'date' => $event->date?->format('Y-m-d'),
                'location' => $event->location,
                'description' => $event->description,
                'type' => 'rehearsal',
            ]);

        return $this->ok([
            'can_manage' => $this->canManage($request->user()),
            'choir' => [
                'id' => $choir->id,
                'name' => $choir->name,
                'history' => $choir->history,
                'founded_at' => $choir->created_at?->format('Y-m-d'),
            ],
            'milestones' => $this->milestones($choir),
            'events' => $events->merge($rehearsals)->sortByDesc('date')->values(),
            'photos' => $this->photoPage($request, $choir),
        ]);
    }

    public function indexPhotos(Request $request): JsonResponse
    {
        $choir = $this->authorizedChoir($request);

        return $this->ok($this->photoPage($request, $choir));
    }

    private function photoPage(Request $request, Choir $choir): array
    {
        $perPage = max(1, min((int) $request->input('per_page', 50), 100));

        $items = $choir->galleryItems()
            ->where('is_history', true)
            ->where('media_type', 'image')
            ->latest('event_date')
            ->latest('id')
            ->paginate($perPage);

        return [
            'items' => collect($items->items())
                ->map(fn (GalleryItem $item) => $this->photoData($item))
                ->values()
                ->all(),
            'pagination' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
                'from' => $items->firstItem(),
                'to' => $items->lastItem(),
            ],
        ];
    }

    public function update(Request $request): JsonResponse
    {
        $choir = $this->authorizedChoir($request, true);
        $validator = Validator::make($request->all(), [
            'history' => ['nullable', 'string', 'max:20000'],
        ]);

        if ($validator->fails()) {
            return $this->error('Please check the history content.', $validator->errors(), 422);
        }

        $choir->update(['history' => $validator->validated()['history'] ?? null]);

        return $this->ok(['history' => $choir->history], 'Choir history updated successfully.');
    }

    public function storePhoto(Request $request): JsonResponse
    {
        $choir = $this->authorizedChoir($request, true);

        $validator = Validator::make($request->all(), [
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'event_date' => ['nullable', 'date'],
        ], [
            'photo.image' => 'The historical photo must be a valid image.',
            'photo.mimes' => 'Historical photos must be JPG, PNG, or WebP images.',
            'photo.max' => 'Each historical photo must be 10 MB or smaller.',
        ]);

        if ($validator->fails()) {
            return $this->error('Please check the photo details.', $validator->errors(), 422);
        }

        $photo = $request->file('photo');
        $path = Storage::disk('local')->put("choir-history/{$choir->id}", $photo);
        $item = $choir->galleryItems()->create([
            'title' => $validator->validated()['title'] ?? $photo->getClientOriginalName(),
            'description' => $validator->validated()['description'] ?? null,
            'media_path' => $path,
            'media_type' => 'image',
            'event_date' => $validator->validated()['event_date'] ?? null,
            'is_public' => false,
            'is_history' => true,
            'uploaded_by' => $request->user()->id,
        ]);

        return $this->ok($this->photoData($item), 'Historical photo uploaded successfully.', 201);
    }

    public function destroyPhoto(Request $request, GalleryItem $galleryItem): JsonResponse
    {
        $choir = $this->authorizedChoir($request, true);
        abort_unless($galleryItem->choir_id === $choir->id && $galleryItem->is_history, 404);

        Storage::disk('local')->delete([$galleryItem->media_path, $this->thumbnailPath($galleryItem)]);
        $galleryItem->delete();

        return $this->ok(null, 'Historical photo deleted successfully.');
    }

    public function replacePhoto(Request $request, GalleryItem $galleryItem): JsonResponse
    {
        $choir = $this->authorizedChoir($request, true);
        abort_unless($galleryItem->choir_id === $choir->id && $galleryItem->is_history, 404);

        $validator = Validator::make($request->all(), [
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'event_date' => ['nullable', 'date'],
        ]);

        if ($validator->fails()) {
            return $this->error('Please check the replacement photo details.', $validator->errors(), 422);
        }

        $photo = $request->file('photo');
        $path = Storage::disk('local')->put("choir-history/{$choir->id}", $photo);
        Storage::disk('local')->delete([$galleryItem->media_path, $this->thumbnailPath($galleryItem)]);
        $galleryItem->update([
            'title' => $validator->validated()['title'] ?? $galleryItem->title,
            'description' => $validator->validated()['description'] ?? $galleryItem->description,
            'event_date' => $validator->validated()['event_date'] ?? $galleryItem->event_date,
            'media_path' => $path,
            'media_type' => 'image',
            'is_public' => false,
        ]);

        return $this->ok($this->photoData($galleryItem), 'Historical photo replaced successfully.');
    }

    public function photo(Request $request, GalleryItem $galleryItem)
    {
        $choir = $this->authorizedChoir($request);
        abort_unless($galleryItem->choir_id === $choir->id && $galleryItem->is_history, 404);
        abort_unless(Storage::disk('local')->exists($galleryItem->media_path), 404);

        return response()->file(Storage::disk('local')->path($galleryItem->media_path), [
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    public function thumbnail(Request $request, GalleryItem $galleryItem)
    {
        $choir = $this->authorizedChoir($request);
        abort_unless($galleryItem->choir_id === $choir->id && $galleryItem->is_history, 404);
        abort_unless(Storage::disk('local')->exists($galleryItem->media_path), 404);

        $sourcePath = $galleryItem->media_path;
        $thumbPath = $this->thumbnailPath($galleryItem);

        if (! Storage::disk('local')->exists($thumbPath)) {
            $this->generateThumbnail($sourcePath, $thumbPath);
        }

        // Fall back to the original file when a thumbnail cannot be generated.
        $servedPath = Storage::disk('local')->exists($thumbPath) ? $thumbPath : $sourcePath;

        return response()->file(Storage::disk('local')->path($servedPath), [
            'Cache-Control' => 'private, max-age=86400',
        ]);
    }

    private function thumbnailPath(GalleryItem $item): string
    {
        return 'choir-history/'.$item->choir_id.'/thumbs/'.$item->id.'.webp';
    }

    private function generateThumbnail(string $sourcePath, string $thumbPath): bool
    {
        try {
            $manager = new ImageManager(new Driver);
            $image = $manager->decodePath(Storage::disk('local')->path($sourcePath));
            $image->cover(640, 480);

            Storage::disk('local')->put($thumbPath, $image->encode(new WebpEncoder(80))->toString());

            return true;
        } catch (\Throwable $e) {
            logger()->warning('Could not generate choir history thumbnail.', [
                'source_path' => $sourcePath,
                'thumb_path' => $thumbPath,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    private function photoData(GalleryItem $item): array
    {
        return [
            'id' => $item->id,
            'title' => $item->title,
            'description' => $item->description,
            'event_date' => $item->event_date ? (string) $item->event_date : null,
            'url' => "/member/choir-history/photos/{$item->id}/file",
            'thumb_url' => "/member/choir-history/photos/{$item->id}/thumbnail",
        ];
    }

    private function milestones(Choir $choir): array
    {
        $firstPerformance = $choir->performances()->oldest('date')->first();
        $latestPerformance = $choir->performances()->latest('date')->first();

        return collect([
            [
                'id' => 'founded',
                'title' => 'Choir founded',
                'date' => $choir->created_at?->format('Y-m-d'),
                'description' => 'The choir began its journey of worship and fellowship.',
            ],
            [
                'id' => 'first-performance',
                'title' => 'First recorded performance',
                'date' => $firstPerformance?->date?->format('Y-m-d'),
                'description' => $firstPerformance?->title,
            ],
            [
                'id' => 'latest-performance',
                'title' => 'Latest recorded performance',
                'date' => $latestPerformance?->date?->format('Y-m-d'),
                'description' => $latestPerformance?->title,
            ],
        ])->filter(fn ($milestone) => $milestone['date'])->values()->all();
    }
}
