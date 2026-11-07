# SalamaFarm Django API — Hostinger VPS Operations

This runbook records the Hostinger deployment and off-site backup setup as observed on 16 October 2026. It is intended for the organisation's technical maintainers. It contains no passwords, OAuth tokens, encryption keys, or database URLs.

## Current layout

| Component | Current configuration |
|---|---|
| Django API | `https://api-next.salamafarm.com` |
| Django health check | `https://api-next.salamafarm.com/health/` returns `{"status": "ok", "engine": "django"}`; `/ready/` returns `{"ready": true}` |
| Django container | `salamafarm_django`, built from `/opt/salamafarm-django/backend`, listening on `127.0.0.1:8001` through host networking |
| Django source checkout | `/opt/salamafarm-django` |
| Django database | Dedicated host PostgreSQL database `salamafarm_django`, role `salamafarm_django`; Django's private environment file is `/etc/salamafarm-django.env` |
| Django media | Docker volume `salamafarm-django_django_media`, mounted at `/app/media` in the container |
| Public web proxy | Nginx terminates HTTPS and proxies `api-next.salamafarm.com` to Django on `127.0.0.1:8001`; Certbot certificate was issued for this hostname |
| Existing FastAPI service | `api.salamafarm.com`, container `agrovet_backend`, port `8000`; it remains separate from Django |
| Existing FastAPI database | `salama_agrovet`; it is separate from Django's `salamafarm_django` database |

The temporary DNS record `api-next.salamafarm.com` points to the VPS IPv4 address. The existing `api.salamafarm.com` record and FastAPI service were left unchanged during Django setup.

The live VPS configuration file `/opt/salamafarm-django/compose.hostinger.yml` is server-side and was created directly on the VPS; it is not currently tracked in this repository. It runs migrations and `collectstatic`, then starts Gunicorn on `127.0.0.1:8001`. The secret environment file and database credentials are also server-side and must never be committed.

## Checks and administration

Run these commands on the VPS as root (or prefix with `sudo` as appropriate):

```bash
# API health
curl -fsS https://api-next.salamafarm.com/health/
curl -fsS https://api-next.salamafarm.com/ready/

# Container state and recent application logs
docker ps --filter name=salamafarm_django
docker logs --tail 100 salamafarm_django

# Nginx configuration check
nginx -t

# Django admin availability (authentication still required)
curl -sS -o /dev/null -w 'Admin HTTP %{http_code}\n' \
  https://api-next.salamafarm.com/admin/login/
```

The marketplace endpoint was smoke-tested at `GET /api/v1/marketplace/products/`; a product and its uploaded image were successfully served by the Django API after Nginx media access was configured.

## Database and media backups

### Local and encrypted Google Drive copies

The backup script is installed on the VPS at `/usr/local/sbin/salamafarm-drive-backup` with mode `700`. It:

1. Creates a UTC timestamped directory under `/var/backups/salamafarm/` (root-only).
2. Dumps the `salamafarm_django` PostgreSQL database in custom `pg_dump` format, excluding ownership and ACLs.
3. Creates a gzip archive of the complete Django media volume.
4. Verifies the database archive with `pg_restore --list` and the media archive with `tar -tzf`.
5. Uploads both archives using the encrypted rclone remote.

The rclone remotes are:

- `gdrive`: Google Drive, authorized with the narrow `drive.file` scope.
- `salama-backups-crypt`: rclone crypt remote backed by `gdrive:SalamaFarm-VPS-Backups`, with standard filename encryption and directory-name encryption enabled.

Encrypted daily backup paths appear through the crypt remote as `salama-backups-crypt:daily/<UTC timestamp>/`. The organisation's Google Drive quota was confirmed as 400 GiB total; 391.946 GiB was free at the time of the check. A temporary file was uploaded, downloaded, compared, and deleted successfully through the crypt remote.

The rclone configuration lives at `/root/.config/rclone/rclone.conf` and was restricted to mode `600`; its directory is mode `700`. The configuration contains sensitive OAuth material, and rclone only obscures the crypt password fields there; this is not a substitute for protecting the config file. Do not print it, paste it into support chats, or commit it to Git. Store the crypt password and salt (`password2`) in the organisation password manager outside the VPS. Without them, encrypted backups cannot be restored.

### Automatic schedule

The systemd oneshot service and timer are:

- `/etc/systemd/system/salamafarm-drive-backup.service`
- `/etc/systemd/system/salamafarm-drive-backup.timer`

The timer is enabled and runs daily at 23:30 UTC (02:30 Africa/Nairobi), with a small randomized delay and `Persistent=true` to catch up after downtime.

Check scheduling and execution:

```bash
systemctl list-timers salamafarm-drive-backup.timer --all
systemctl status salamafarm-drive-backup.service --no-pager
journalctl -u salamafarm-drive-backup.service --since today --no-pager
```

Run a backup manually if needed:

```bash
/usr/local/sbin/salamafarm-drive-backup
```

The initial manual run completed successfully at `2026-10-16T13:57:23Z`. The systemd timer was enabled afterward. Confirm a scheduled run in the journal before treating the automation as fully operational.

### Retention and recovery status

No automatic retention or pruning policy has been configured yet. Local archives and Drive snapshots will accumulate. Monitor VPS disk use and Drive quota, then agree on a retention period before enabling automated deletion.

Archive-format checks and an encrypted upload/download round-trip have passed. A full database-and-media restore rehearsal has **not** yet been performed. Before relying on these backups for disaster recovery, restore a selected snapshot into an isolated test database and temporary media directory, verify the data and images, and document the recovery time and exact procedure. Do not restore over production without a separate, verified pre-restore backup and an approved maintenance window.

## Network and security notes

- The Django service is reachable through Nginx on HTTPS; its Gunicorn listener is bound to loopback port `8001`.
- The existing FastAPI container continues to use port `8000`.
- The UFW rule set was changed to remove broad `5432` allow rules and allow PostgreSQL traffic on `docker0` from `172.17.0.0/16`. A test from the Mac to `191.101.2.51:5432` timed out.
- At the last inspection, PostgreSQL was still listening on `0.0.0.0:5432` and `[::]:5432`. Although the external test timed out, re-check the Hostinger firewall and PostgreSQL listener after changes. Prefer binding only to loopback and the required Docker bridge address while preserving both applications' database connectivity. Do not expose PostgreSQL publicly.
- Keep `/etc/salamafarm-django.env`, the rclone config, SSH private keys, OAuth client credentials, database passwords, Django `SECRET_KEY`, and crypt secrets out of Git and chat messages.
- Hostinger's VPS plan showed weekly provider backups. These are an additional recovery layer, not a replacement for the encrypted database/media backups. The paid daily-backup add-on was not enabled.

## Recommended next actions

1. Confirm the first scheduled backup succeeded by checking `journalctl` and that a new timestamp appears under `salama-backups-crypt:daily/`.
2. Define and implement local and Drive retention after agreeing how many daily restore points the organisation needs.
3. Perform and document an isolated restore drill for both the PostgreSQL dump and media archive.
4. Review PostgreSQL's bind address and provider firewall so the database is not reachable from the public internet while Docker applications can still connect.
5. Decide whether `api-next.salamafarm.com` remains the permanent Django API hostname or is temporary. Update the Flutter app's API base URL only after that decision and successful end-to-end testing.
6. Decide whether VPS deployment automation should be added to the repository. The current Hostinger Compose file and systemd units were created on the server and are not version-controlled.

## Safe handling

This document intentionally records names, paths, and operational commands only. Never add live secret values to it. If a credential or token is accidentally disclosed, rotate or revoke it promptly and update the server's protected configuration.
