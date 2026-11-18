
DO $$
BEGIN
  ALTER TYPE payment_status ADD VALUE 'partial';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS school_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  late_fee_flat NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (late_fee_flat >= 0),
  late_fee_enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO school_settings (id, late_fee_flat, late_fee_enabled)
VALUES (1, 200, false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE fee_vouchers
  ADD COLUMN IF NOT EXISTS late_fee_applied NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_fee_waived BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE fee_adjustment_type AS ENUM ('credit', 'refund', 'waiver');

CREATE TABLE IF NOT EXISTS fee_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID REFERENCES fee_vouchers (id) ON DELETE SET NULL,
  student_id UUID REFERENCES students (id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  adjustment_type fee_adjustment_type NOT NULL,
  reason TEXT NOT NULL,
  recorded_by_user_id UUID REFERENCES app_users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fee_adjustments_voucher ON fee_adjustments (voucher_id);
CREATE INDEX idx_fee_adjustments_student ON fee_adjustments (student_id);

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS table_name TEXT,
  ADD COLUMN IF NOT EXISTS record_id TEXT;

UPDATE audit_logs
SET
  table_name = COALESCE(table_name, entity_type),
  record_id = COALESCE(record_id, entity_id)
WHERE table_name IS NULL OR record_id IS NULL;

CREATE OR REPLACE FUNCTION refresh_voucher_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount_paid >= NEW.amount_due THEN
    NEW.status := 'paid';
  ELSIF NEW.amount_paid > 0 THEN
    NEW.status := 'partial';
  ELSIF NEW.due_date < CURRENT_DATE THEN
    NEW.status := 'overdue';
  ELSE
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION apply_configured_late_fees()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  flat NUMERIC(12, 2);
  enabled BOOLEAN;
BEGIN
  SELECT late_fee_flat, late_fee_enabled INTO flat, enabled FROM school_settings WHERE id = 1;
  IF NOT COALESCE(enabled, false) OR COALESCE(flat, 0) <= 0 THEN
    RETURN;
  END IF;

  UPDATE fee_vouchers v
  SET amount_due = v.amount_due + flat,
      late_fee_applied = flat
  WHERE v.due_date < CURRENT_DATE
    AND v.amount_paid < v.amount_due
    AND v.late_fee_waived = false
    AND COALESCE(v.late_fee_applied, 0) = 0;
END;
$$;

CREATE OR REPLACE FUNCTION sync_voucher_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM apply_configured_late_fees();
  UPDATE fee_vouchers
  SET amount_paid = amount_paid
  WHERE amount_paid < amount_due;
END;
$$;

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_adjustments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS students_deny_anon ON students;
CREATE POLICY students_deny_anon ON students FOR ALL TO anon USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS fee_vouchers_deny_anon ON fee_vouchers;
CREATE POLICY fee_vouchers_deny_anon ON fee_vouchers FOR ALL TO anon USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS payments_deny_anon ON payments;
CREATE POLICY payments_deny_anon ON payments FOR ALL TO anon USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS app_users_deny_anon ON app_users;
CREATE POLICY app_users_deny_anon ON app_users FOR ALL TO anon USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS audit_logs_deny_anon ON audit_logs;
CREATE POLICY audit_logs_deny_anon ON audit_logs FOR ALL TO anon USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS school_settings_deny_anon ON school_settings;
CREATE POLICY school_settings_deny_anon ON school_settings FOR ALL TO anon USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS fee_adjustments_deny_anon ON fee_adjustments;
CREATE POLICY fee_adjustments_deny_anon ON fee_adjustments FOR ALL TO anon USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS students_staff_auth ON students;
CREATE POLICY students_staff_auth ON students FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'accountant'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'accountant'));

DROP POLICY IF EXISTS fee_vouchers_staff_auth ON fee_vouchers;
CREATE POLICY fee_vouchers_staff_auth ON fee_vouchers FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'accountant'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'accountant'));

DROP POLICY IF EXISTS payments_staff_auth ON payments;
CREATE POLICY payments_staff_auth ON payments FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'accountant'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'accountant'));