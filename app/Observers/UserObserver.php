<?php

namespace App\Observers;

use App\Models\Member;
use App\Models\User;

/**
 * UserObserver
 *
 * Keeps the `members` table in sync with the lifecycle of the `users` table so
 * that the Attendance page always shows the correct active roster:
 *
 *  • When a user is hard-deleted  → soft-delete their linked Member record(s).
 *    This preserves historical attendance records while removing them from
 *    the active roster.
 *
 *  • When a user is deactivated or rejected → mark their linked Member(s) as
 *    'inactive' so they are excluded from new attendance sessions.
 *
 *  • When a user is re-approved / deactivation is cleared → restore the Member
 *    record (if soft-deleted) and set status back to 'active'.
 */
class UserObserver
{
    /**
     * Handle the User "updated" event.
     *
     * Runs after any save(). We check whether the approval status or
     * deactivated_at changed and sync the linked Member accordingly.
     */
    public function updated(User $user): void
    {
        $statusChanged     = $user->wasChanged('status');
        $deactivatedChanged = $user->wasChanged('deactivated_at');

        if (! $statusChanged && ! $deactivatedChanged) {
            return;
        }

        $isNowActive = $user->status === User::STATUS_APPROVED
            && is_null($user->deactivated_at);

        if ($isNowActive) {
            // Re-activate / restore linked Member records
            Member::withTrashed()
                ->where('user_id', $user->id)
                ->each(function (Member $member) {
                    if ($member->trashed()) {
                        $member->restore();
                    }
                    if ($member->status !== 'active') {
                        $member->status = 'active';
                        $member->save();
                    }
                });
        } else {
            // Deactivate linked Member records (don't soft-delete; keep them
            // in history but exclude from the active attendance roster).
            Member::where('user_id', $user->id)
                ->where('status', 'active')
                ->update(['status' => 'inactive']);
        }
    }

    /**
     * Handle the User "deleting" event (hard delete).
     *
     * Soft-delete the linked Member record(s) so historical attendance is
     * preserved but they no longer appear in the live attendance roster.
     *
     * IMPORTANT: We collect the member IDs *before* issuing the delete so
     * that we can fall back to an ID-based query even if the DB-level
     * nullOnDelete() FK constraint fires before (or concurrently with) our
     * observer. This prevents the scenario where a previously-deleted user's
     * member record survives with user_id = NULL and status = 'active', which
     * would make it look like a guest / offline member on the Attendance page.
     */
    public function deleting(User $user): void
    {
        // Collect member IDs first — before the DB FK can nullify user_id.
        $memberIds = Member::where('user_id', $user->id)->pluck('id');

        if ($memberIds->isEmpty()) {
            return;
        }

        // Soft-delete by primary key so that even if user_id is subsequently
        // nullified by the DB FK constraint, the rows have deleted_at set and
        // will not appear in any active-member queries.
        Member::whereIn('id', $memberIds)->each(function (Member $member) {
            $member->delete(); // SoftDeletes trait → sets deleted_at
        });
    }
}
