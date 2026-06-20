const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');
    
    const db = mongoose.connection.db;
    const users = db.collection('users');
    
    // Check if user already exists
    const existing = await users.findOne({ email: 'admin@nabatech.com' });
    if (existing) {
      console.log('User already exists! Updating password and role instead...');
      const hashedPassword = await bcrypt.hash('Admin123', 12);
      await users.updateOne(
        { email: 'admin@nabatech.com' },
        { $set: { password: hashedPassword, role: 'admin' } }
      );
      console.log('User updated successfully!');
    } else {
      console.log('Creating new admin user...');
      const hashedPassword = await bcrypt.hash('Admin123', 12);
      const result = await users.insertOne({
        email: 'admin@nabatech.com',
        password: hashedPassword,
        name: 'Nabatech Admin',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        xp: 0,
        level: 1,
        badges: []
      });
      console.log('Admin created successfully:', result);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run();
