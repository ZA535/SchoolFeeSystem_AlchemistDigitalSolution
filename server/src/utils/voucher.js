export function currentBillingPeriod(date = new Date()) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

export function defaultDueDate(year, month) {
  const due = new Date(year, month, 0);
  due.setDate(10);
  return due.toISOString().slice(0, 10);
}