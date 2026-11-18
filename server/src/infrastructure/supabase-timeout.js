import { AppError } from '../shared/app-error.js';
import { dbOperationTimedOut } from '../enums/messages.js';

const DB_TIMEOUT_MS = Number(process.env.DB_TIMEOUT_MS) || 20000;

export async function withDbTimeout(promise, label = 'database') {
  let timer;
  try {
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new AppError(dbOperationTimedOut(label), 504)),
        DB_TIMEOUT_MS
      );
    });
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
