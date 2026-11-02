# Nayax nightly sync

## What you get
- A **Nayax** card in Settings (there is no separate admin page in ClawOps, so it goes here) with a **Sync now** button, the last sync time, and status (Success / Failed + message, number of sales pulled).
- Every night at 2:00 AM Eastern, sales from every machine with a Nayax ID are pulled in automatically.
- A daily summary of revenue and number of vends per machine per day.

## Steps
1. **Secret** – request `NAYAX_LYNX_TOKEN` through the secure form (you paste the Lynx API token from Nayax).
2. **Database**
   - Reuse the existing (empty) `nayax_transactions` table instead of a new one; add `machine_name`, `card_brand` columns and a unique index on `nayax_transaction_id` (TransactionID). Existing columns map: MachineID → `nayax_machine_id`, SettlementValue → `amount`, PaymentMethod → `payment_method`, AuthorizationDateTimeGMT → `transaction_date`; full payload kept in `raw_data`. Each row is linked to our `location_machines` row and its owner.
   - New `nayax_sync_runs` table (started/finished, status, rows upserted, error) for the status display; owner-readable via RLS.
   - View `nayax_daily_rollup` (`security_invoker`): machine, day (Eastern), revenue sum, vend count.
3. **Function `nayax-sync`**
   - Loads all `location_machines` with a `nayax_machine_id`, calls `GET https://lynx.nayax.com/operational/v1/machines/{id}/lastSales` with `Authorization: Bearer <token>`, upserts on TransactionID (no duplicates on re-runs), records the run, updates `location_machines.last_nayax_sync` and `nayax_settings.last_sync`.
   - Two modes: cron call (shared secret header, all machines) and signed-in "Sync now" (validated JWT, only that owner's machines).
   - Per-machine errors are logged and don't stop the rest.
4. **Schedule** – `pg_cron` job daily. Cron runs in UTC, so 2 AM ET = `0 7 * * *` (EST). During daylight time that lands at 3 AM ET; alternatively run at `0 6,7 * * *` and skip if not 2 AM ET (2 runs/day, still cheap). Default: the DST-safe double schedule.
5. **UI** – Settings → Integrations Nayax card: Sync now button (spinner, toast with result), last sync time, status badge, last error.

## Things to know
- One shared Nayax token means one Nayax account for the whole app — fine for your own machines; other ClawOps customers would need per-account tokens later.
- `lastSales` only returns recent sales, so a nightly run catches up to Nayax's recent window, not full history.
- I'll test with a manual call after you add the token.
