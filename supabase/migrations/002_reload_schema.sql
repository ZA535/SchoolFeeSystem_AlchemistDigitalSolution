-- Run after 001 if the API cannot find sync_voucher_statuses (schema cache).
NOTIFY pgrst, 'reload schema';