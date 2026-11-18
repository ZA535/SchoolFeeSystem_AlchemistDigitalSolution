export const NavLabel = Object.freeze({
  DASHBOARD: 'Dashboard',
  STUDENTS: 'Students',
  COLLECT_FEE: 'Collect fee',
  FEE_VOUCHERS: 'Fee vouchers',
  REPORTS: 'Reports',
  STAFF: 'Staff',
  MENU: 'Menu',
  CLOSE_MENU: 'Close menu',
});

export const RoleLabel = Object.freeze({
  ADMINISTRATOR: 'Administrator',
  ACCOUNTANT: 'Accountant',
  VIEWER: 'Viewer',
  ADMIN_FULL: 'Admin (full access)',
  ACCOUNTANT_CASHIER: 'Accountant / Cashier',
});

export const STAFF_ROLE_OPTIONS = [
  { value: 'admin', label: RoleLabel.ADMIN_FULL },
  { value: 'accountant', label: RoleLabel.ACCOUNTANT_CASHIER },
];

export const GreetingLabel = Object.freeze({
  MORNING: 'Good morning',
  AFTERNOON: 'Good afternoon',
  EVENING: 'Good evening',
});

export const LoadingLabel = Object.freeze({
  DEFAULT: 'Loading…',
  DATA: 'Loading data…',
  PLEASE_WAIT: 'Please wait…',
});

export const DialogLabel = Object.freeze({
  CONFIRM: 'Confirm',
  CANCEL: 'Cancel',
  DISABLE: 'Disable',
  ENABLE: 'Enable',
});

export const StaffDialog = Object.freeze({
  DISABLE_TITLE: 'Disable staff account?',
  ENABLE_TITLE: 'Enable staff account?',
});

export function disableStaffMessage(fullName) {
  return `${fullName} will not be able to sign in.`;
}

export function enableStaffMessage(fullName) {
  return `${fullName} can sign in again with their existing password.`;
}

export const EmptyStateLabel = Object.freeze({
  NO_STUDENTS_TITLE: 'No students found',
  NO_STUDENTS_FILTERED: 'Try adjusting your search or class filter.',
  NO_STUDENTS_EMPTY: 'Enroll your first student to start collecting fees.',
  ADD_STUDENT: 'Add student',
});

export const FormLabel = Object.freeze({
  EDIT_STUDENT: 'Edit student',
  ADD_STUDENT: 'Add student',
  SAVE_STUDENT: 'Save student',
  UPDATE_STUDENT: 'Update student',
  SAVING: 'Saving…',
  SAVE_USER: 'Save user',
  SAVE_FEE_RULES: 'Save fee rules',
  RECORD_PAYMENT: 'Record payment',
  RECORDING: 'Recording…',
  GENERATE_VOUCHERS: 'Generate monthly vouchers',
  GENERATING: 'Generating…',
  SIGN_IN: 'Sign in',
  SIGNING_IN: 'Signing in…',
});

export const ReceiptLabel = Object.freeze({
  FEE_PAYMENT_RECEIPT: 'Fee Payment Receipt',
});
