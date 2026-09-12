# Authorization Audit

## Enforcement model

- API authentication uses `auth:sanctum`.
- `admin` middleware allows only API-guard `admin` and `super-admin` roles.
- `member` middleware allows only approved `member` accounts for member APIs.
- `attendance.manager` middleware allows `admin`, `super-admin`, and `team_leader`; attendance controllers still enforce choir assignment and attendance permissions.
- `choir.access` enforces active choir assignment for choir-scoped routes. Admin and explicit cross-choir permissions bypass it.
- Policies enforce object ownership for choir-scoped writes. Admin and super-admin policy bypass is registered centrally in `AppServiceProvider`.
- React permission checks are presentation-only. Laravel middleware and policies are authoritative.

## Permission matrix

| Role | Permission / capability | Allowed? | API protected? | UI protected? |
|---|---|---:|---|---|
| Admin / Super-admin | View attendance across choirs | Yes | `attendance.manager` + controller choir authorization | Admin Attendance route |
| Choir Leader | View/manage attendance in assigned choirs | Yes | `attendance.manager` + active choir assignment | Leader/Admin Attendance controls |
| Member | View own attendance history | Yes | `member` middleware, user-derived choir/member | Member Attendance page |
| Member | Manage another member's attendance | No | `attendance.manager` denies member | Attendance management UI hidden |
| Admin / Super-admin | View/manage rehearsals and performances | Yes | Admin middleware + policies | Admin pages |
| Choir Leader | View/manage rehearsals and performances in assigned choirs | Yes | `choir.access` + policies + ownership | Leader controls |
| Member | View assigned/member-facing schedules | Yes | `member` middleware and user-derived choir | Member pages |
| Choir Leader | View another choir's rehearsals or performances | No | Active choir assignment and policy ownership | Not offered |
| Admin / Super-admin | View/manage choir members | Yes | Admin middleware + policies | Admin member UI |
| Choir Leader | View/manage members in assigned choirs | Yes | `choir.access` + `MemberPolicy` ownership | Leader controls |
| Member | Manage choir members | No | `choir.access` denies writes; member middleware denies admin APIs | Hidden |
| Member | Submit songs | Yes | `member` middleware; own-user endpoint | Member song submission UI |
| Choir Leader | Review/edit/delete songs in assigned choirs | Yes | `choir.access` + `SongPolicy` ownership | Leader song controls |
| Admin / Super-admin | Review, approve, reject songs | Yes | Admin middleware + `SongPolicy` admin-only approval | Admin song controls |
| Choir Leader / Member | Approve or reject songs | No | `SongPolicy` denies | Hidden |
| Admin / Super-admin | Manage choir history and historical photos | Yes | Admin middleware + history controller checks | Admin history UI |
| Choir Leader | Manage assigned choir history and photos | Yes | Active choir assignment + `gallery.manage` | Leader history controls |
| Member | View assigned choir history | Yes | Approved account + active choir assignment | Member history page |
| All authenticated users | View and update own notifications | Yes | User ID scoped in controller | Notification UI |
| Admin / Super-admin | Manage system settings | Yes | Admin middleware; `settings.manage` is catalogued for explicit capability mapping | Admin Settings page |
| Choir Leader / Member | Manage system settings | No | Admin middleware denies | Hidden |
| Choir Leader / Member | Manage roles, permissions, users, or admin reports | No | Admin middleware denies | Admin-only routes/pages |

## Existing permission groups

The seeded API permissions cover users, roles, permissions, choirs, members, songs, lyrics, rehearsals, attendance, performances, calendar, announcements, gallery, audit logs, notifications, reports, and `settings.manage`. Admin and super-admin receive the full system set. Members receive read/member-facing capabilities. Choir leaders receive assigned-choir management capabilities without any `*.view.all` permission.

Song submission is a member workflow, while song review/approval/rejection is intentionally enforced as an admin-only policy operation rather than adding unused `songs.review`, `songs.approve`, or `songs.reject` permissions.

## Verified API cases

`tests/Feature/AuthorizationAuditTest.php` verifies:

- A leader cannot read or modify another choir's resources.
- A member cannot access admin, leader, modern attendance, or legacy nested attendance APIs.
- A super-admin can access admin settings and user APIs.

`tests/Feature/AttendanceTest.php` continues to verify attendance choir isolation, leader assignment, lifecycle changes, and historical records.
