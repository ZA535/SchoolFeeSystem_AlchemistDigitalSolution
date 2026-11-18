export const ToastMessage = Object.freeze({
  FEE_RULES_UPDATED: 'Fee rules updated.',
  STUDENT_UPDATED: 'Student updated successfully.',
  STUDENT_ADDED: 'Student added successfully.',
  STUDENT_DEACTIVATED: 'Student deactivated.',
  STAFF_ADDED: 'Staff member added successfully.',
  STAFF_DISABLED: 'Staff account disabled.',
  STAFF_ENABLED: 'Staff account enabled.',
});

export const ClientErrorMessage = Object.freeze({
  REQUEST_TIMED_OUT: 'Request timed out. Check your connection and try again.',
  REQUEST_FAILED: 'Request failed',
  USE_TOAST_OUTSIDE_PROVIDER: 'useToast must be used within ToastProvider',
  USE_AUTH_OUTSIDE_PROVIDER: 'useAuth requires AuthProvider',
});

export const NetworkMessage = Object.freeze({
  OFFLINE: 'You are offline. Reconnect to save fee payments.',
  SLOW_CONNECTION: 'Slow connection detected. Requests may take longer.',
});

export function monthlyVouchersGenerated(monthLabel) {
  return `Monthly vouchers generated for ${monthLabel}.`;
}

export function feeCollectionPaidFull(receiptNumber) {
  return `Payment recorded — voucher fully paid (receipt ${receiptNumber}).`;
}

export function feeCollectionPaidPartial(receiptNumber) {
  return `Partial payment saved — receipt ${receiptNumber}.`;
}

export function vouchersPaidFull(receiptNumber) {
  return `Payment recorded — voucher marked paid (receipt ${receiptNumber}).`;
}

export function vouchersPaymentRecorded(receiptNumber) {
  return `Payment recorded — receipt ${receiptNumber}.`;
}

export function apiErrorWithRef(message, requestId) {
  const suffix = requestId ? ` (ref: ${requestId.slice(0, 8)})` : '';
  return message + suffix;
}
