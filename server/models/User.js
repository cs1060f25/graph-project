// In-memory user store (will be replaced with actual DB in Component 2)
const users = [];

class User {
  static async upsert({ id, email, displayName }) {
    const existingUser = users.find(u => u.id === id);
    
    if (existingUser) {
      existingUser.email = email;
      existingUser.displayName = displayName;
      existingUser.lastLoginAt = new Date();
      return existingUser;
    } else {
      const newUser = {
        id,
        email,
        displayName,
        role: 'user', // Default role
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
      users.push(newUser);
      return newUser;
    }
  }

  static async findById(id) {
    return users.find(u => u.id === id);
  }

  static async findByEmail(email) {
    return users.find(u => u.email === email);
  }
}

export default User;

