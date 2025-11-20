export function formatAuthError(error: any): string {
  if (!error) {
    return 'Failed to authenticate. Please try again.';
  }

  const code = error.code || '';
  const message = error.message || '';

  if (code === 'auth/email-already-in-use') {
    return 'This email is already registered. Please sign in instead.';
  }
  if (code === 'auth/user-not-found') {
    return 'No account found with this email. Please sign up.';
  }
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Incorrect password. Please try again.';
  }
  if (code === 'auth/weak-password') {
    return 'Password should be at least 6 characters.';
  }
  if (code === 'auth/invalid-email') {
    return 'Invalid email address.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Please check your connection and try again.';
  }

  return message || 'Failed to authenticate. Please try again.';
}

