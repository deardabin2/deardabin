#!/usr/bin/env bash
# 로컬 PostgreSQL 에 Supabase 흉내 + 마이그레이션을 올리고 RLS 검증 스크립트를 실행한다.
# 사용: PGHOST=... PGPORT=... PGUSER=postgres scripts/local-pg/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=dmb_test
psql -v ON_ERROR_STOP=1 -q -d postgres -c "drop database if exists $DB" -c "create database $DB"
for r in anon authenticated service_role; do
  psql -q -d postgres -c "drop role if exists $r" >/dev/null 2>&1 || true
done
psql -v ON_ERROR_STOP=1 -q -d $DB -f scripts/local-pg/supabase-stub.sql
for f in supabase/migrations/*.sql; do
  echo "▶ $f"
  psql -v ON_ERROR_STOP=1 -q -d $DB -f "$f"
done
echo "▶ supabase/tests/rls_check.sql"
psql -v ON_ERROR_STOP=1 -q -d $DB -f supabase/tests/rls_check.sql
