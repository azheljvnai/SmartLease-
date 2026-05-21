export function getFirebaseErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: string }).code)
      : '';

  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: string }).message)
      : 'An unexpected error occurred';

  const map: Record<string, string> = {
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/invalid-credential': 'Invalid email or password.',
    'permission-denied': 'You do not have permission to perform this action.',
    'unavailable': 'Service temporarily unavailable. Check your connection.',
    'not-found': 'The requested resource was not found.',
    'already-exists': 'This record already exists.',
  };

  for (const [key, value] of Object.entries(map)) {
    if (code.includes(key) || message.includes(key)) return value;
  }

  return message;
}
