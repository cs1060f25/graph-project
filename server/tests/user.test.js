const User = require('../models/User');

async function runTests() {
  console.log('Running User model tests...\n');

  // Test 1: upsert creates a new user
  try {
    const userData = {
      id: 'test-uid-123',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    const user = await User.upsert(userData);

    if (!user || user.id !== 'test-uid-123' || user.email !== 'test@example.com') {
      throw new Error('Test failed');
    }
    console.log('✓ upsert creates a new user');
  } catch (error) {
    console.log('✗ upsert creates a new user:', error.message);
  }

  // Test 2: upsert updates existing user
  try {
    const userData1 = {
      id: 'test-uid-update',
      email: 'original@example.com',
      displayName: 'Original User',
    };

    const user1 = await User.upsert(userData1);
    await new Promise(resolve => setTimeout(resolve, 10));

    const userData2 = {
      id: 'test-uid-update',
      email: 'updated@example.com',
      displayName: 'Updated User',
    };

    const user2 = await User.upsert(userData2);

    if (user2.id !== 'test-uid-update' || user2.email !== 'updated@example.com') {
      throw new Error('Test failed');
    }
    console.log('✓ upsert updates existing user');
  } catch (error) {
    console.log('✗ upsert updates existing user:', error.message);
  }

  // Test 3: findById returns correct user
  try {
    const userData = {
      id: 'test-uid-456',
      email: 'findme@example.com',
      displayName: 'Find Me',
    };

    await User.upsert(userData);
    const foundUser = await User.findById('test-uid-456');

    if (!foundUser || foundUser.id !== 'test-uid-456' || foundUser.email !== 'findme@example.com') {
      throw new Error('Test failed');
    }
    console.log('✓ findById returns correct user');
  } catch (error) {
    console.log('✗ findById returns correct user:', error.message);
  }

  // Test 4: findById returns undefined for non-existent user
  try {
    const foundUser = await User.findById('non-existent-id');
    
    if (foundUser !== undefined) {
      throw new Error('Test failed');
    }
    console.log('✓ findById returns undefined for non-existent user');
  } catch (error) {
    console.log('✗ findById returns undefined for non-existent user:', error.message);
  }

  // Test 5: findByEmail returns correct user
  try {
    const userData = {
      id: 'test-uid-789',
      email: 'email@example.com',
      displayName: 'Email User',
    };

    await User.upsert(userData);
    const foundUser = await User.findByEmail('email@example.com');

    if (!foundUser || foundUser.email !== 'email@example.com') {
      throw new Error('Test failed');
    }
    console.log('✓ findByEmail returns correct user');
  } catch (error) {
    console.log('✗ findByEmail returns correct user:', error.message);
  }

  console.log('\nTests complete!');
}

runTests();
