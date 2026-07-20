# Vehicle Log Manager

React Native (Expo) + FastAPI + Supabase.

## Structure

```
backend/    FastAPI app
mobile/     Expo React Native app
```

## Backend setup

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in SUPABASE_URL + SUPABASE_SERVICE_KEY
```

1. Create a Supabase project.
2. Open the SQL editor and run `db/schema.sql` — creates all tables, indexes,
   and the `trip_debt` / `driver_debt` views (not used by the API yet, but
   ready to swap in for performance; the API currently computes debt in
   Python via `app/services/debt_calculator.py`).
3. Run the API:

```bash
uvicorn app.main:app --reload
```

Docs at `http://localhost:8000/docs`.

## Mobile setup

```bash
cd mobile
npm install
npx expo start
```

Update `API_BASE_URL` in `src/api/client.ts` to your machine's LAN IP if
testing on a physical device via Expo Go (not `localhost`).

## What's implemented vs scaffolded

**Fully implemented (real logic, not stubs):**
- Debt formula (`app/services/debt_calculator.py`) — net-per-load, live trip
  debt, live driver debt, chronological ledger with running balance.
- Charge resolution priority chain (`app/services/charge_resolver.py`) —
  customer → route → product default → custom.
- Collect flow that unlocks discount only at the "Collected" transition.
- Trip-complete guard (all loads must be Collected — this was an open item
  in the plan; I picked this as the rule, flagged in code so it's a one-line
  change if you want different criteria).
- Postgres schema with FKs, indexes, and check constraints matching every
  entity in the plan, plus the `trip_debt`/`driver_debt` views.
- Full CRUD for every entity, dual trip-creation flow (trip-first vs
  loads-first pool), Driver ledger + settlement recording.

**Scaffolded (structure + navigation wired, needs real UI polish):**
- Trip Detail's loads table renders real data but the "Add Load" row and
  inline cell-editing open a placeholder alert — wire these to
  `SearchableDropdown` + `loadsApi.create/update` following the pattern
  already used for expenses.
- Customers / Products / Places / Charge Rules / Reports screens are listed
  in `MoreScreen` but not built out — the API for all of them is ready
  (`src/api/entities.ts`), so each is a copy of the Vehicles list/detail
  pattern.
- Offline write-caching: `useOfflineStatus` + `OfflineBanner` detect
  connectivity and block the UI message, but queued writes for when
  connectivity returns aren't implemented (plan mentions WatermelonDB or
  MMKV — pick one and wrap the API layer's mutations).

## Open items carried over from the plan
- Driver settlement ↔ trip linkage: schema supports an optional `trip_id`
  FK on `driver_settlements`; decide whether to always require it.
- Charge Rule edits after loads exist: currently loads store their resolved
  `charge` at creation time (locked in), so historical loads are unaffected
  by later rate changes. Confirm this is the desired behavior.
