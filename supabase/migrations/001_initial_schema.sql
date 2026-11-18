
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue');
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'easypaisa_jazzcash');

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  roll_number TEXT NOT NULL UNIQUE,
  class_section TEXT NOT NULL,
  monthly_fee NUMERIC(12, 2) NOT NULL CHECK (monthly_fee >= 0),
  guardian_contact TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_students_class_section ON students (class_section);
CREATE INDEX idx_students_roll_number ON students (roll_number);

CREATE TABLE fee_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  billing_year INT NOT NULL,
  billing_month INT NOT NULL CHECK (billing_month BETWEEN 1 AND 12),
  amount_due NUMERIC(12, 2) NOT NULL CHECK (amount_due >= 0),
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  status payment_status NOT NULL DEFAULT 'pending',
  due_date DATE NOT NULL,
  receipt_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, billing_year, billing_month)
);

CREATE INDEX idx_vouchers_status ON fee_vouchers (status);
CREATE INDEX idx_vouchers_billing ON fee_vouchers (billing_year, billing_month);
CREATE INDEX idx_vouchers_student ON fee_vouchers (student_id);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES fee_vouchers (id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method payment_method NOT NULL,
  receipt_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_voucher ON payments (voucher_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER fee_vouchers_updated_at
  BEFORE UPDATE ON fee_vouchers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION refresh_voucher_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount_paid >= NEW.amount_due THEN
    NEW.status := 'paid';
  ELSIF NEW.due_date < CURRENT_DATE THEN
    NEW.status := 'overdue';
  ELSE
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fee_vouchers_status_refresh
  BEFORE INSERT OR UPDATE OF amount_paid, amount_due, due_date ON fee_vouchers
  FOR EACH ROW EXECUTE FUNCTION refresh_voucher_status();

CREATE OR REPLACE FUNCTION sync_voucher_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE fee_vouchers
  SET amount_paid = amount_paid
  WHERE amount_paid < amount_due;
END;
$$;