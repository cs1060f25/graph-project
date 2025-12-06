// server/tests/user.test.js
// Vitest tests for User model

import { describe, it, expect, beforeEach } from 'vitest';
import User, { resetUsers } from '../models/User.js';

describe('User Model', () => {
  beforeEach(() => {
    // Clear users array before each test
    resetUsers();
  });

  it('upsert creates a new user', async () => {
    const userData = {
      id: 'test-uid-123',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    const user = await User.upsert(userData);

    expect(user).toBeDefined();
    expect(user.id).toBe('test-uid-123');
    expect(user.email).toBe('test@example.com');
    expect(user.displayName).toBe('Test User');
    expect(user.role).toBe('user');
  });

  it('upsert updates existing user', async () => {
    const userData1 = {
      id: 'test-uid-update',
      email: 'original@example.com',
      displayName: 'Original User',
    };

    await User.upsert(userData1);
    await new Promise(resolve => setTimeout(resolve, 10));

    const userData2 = {
      id: 'test-uid-update',
      email: 'updated@example.com',
      displayName: 'Updated User',
    };

    const user2 = await User.upsert(userData2);

    expect(user2.id).toBe('test-uid-update');
    expect(user2.email).toBe('updated@example.com');
    expect(user2.displayName).toBe('Updated User');
  });

  it('findById returns correct user', async () => {
    const userData = {
      id: 'test-uid-456',
      email: 'findme@example.com',
      displayName: 'Find Me',
    };

    await User.upsert(userData);
    const foundUser = await User.findById('test-uid-456');

    expect(foundUser).toBeDefined();
    expect(foundUser.id).toBe('test-uid-456');
    expect(foundUser.email).toBe('findme@example.com');
  });

  it('findById returns undefined for non-existent user', async () => {
    const foundUser = await User.findById('non-existent-id');
    expect(foundUser).toBeUndefined();
  });

  it('findByEmail returns correct user', async () => {
    const userData = {
      id: 'test-uid-789',
      email: 'email@example.com',
      displayName: 'Email User',
    };

    await User.upsert(userData);
    const foundUser = await User.findByEmail('email@example.com');

    expect(foundUser).toBeDefined();
    expect(foundUser.email).toBe('email@example.com');
  });
});
