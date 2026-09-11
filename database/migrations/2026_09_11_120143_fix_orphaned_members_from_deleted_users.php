<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Fix orphaned member rows caused by a race condition between the UserObserver
 * and the DB-level nullOnDelete() FK on members.user_id.
 *
 * When a user was deleted, the DB FK set members.user_id = NULL *at the same
 * time* the observer tried to soft-delete by user_id. On some DB engines the
 * FK fires atomically before Eloquent's query, leaving behind rows with
 * user_id = NULL, deleted_at = NULL, status = 'active' — these appeared as
 * "guest members" on the Attendance page even after the user was removed.
 *
 * This migration soft-deletes member rows where:
 *  • user_id IS NULL  (the FK was nullified by the DB constraint)
 *  • deleted_at IS NULL  (the observer soft-delete never ran)
 *  • member_code matches the auto-generated pattern: 1-3 uppercase letters,
 *    a dash, then exactly 4 digits  (e.g. MKC-0007, CH-0034)
 *
 * The auto-generated code pattern is a safe heuristic because
 * UserController::syncMemberForChoir() always creates codes in that format,
 * whereas manually-created offline guest members are less likely to match it.
 *
 * The UserObserver has also been fixed to collect member IDs BEFORE the delete
 * so this race condition cannot recur in the future.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            UPDATE members
            SET    deleted_at = NOW(),
                   status     = 'inactive'
            WHERE  user_id    IS NULL
              AND  deleted_at IS NULL
              AND  member_code REGEXP '^[A-Z]{1,3}-[0-9]{4}$'
        ");
    }

    public function down(): void
    {
        // Cannot reliably undo a data-fix migration.
    }
};
