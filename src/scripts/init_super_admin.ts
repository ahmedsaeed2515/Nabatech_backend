import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../models/user_model';

dotenv.config();

const initSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nabatech');
    console.log('Connected to DB');

    const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@nabatech.local';
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperSecret123!';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      if (existingAdmin.role !== 'super_admin') {
        existingAdmin.role = 'super_admin';
        await existingAdmin.save();
        console.log(`Updated existing user ${adminEmail} to super_admin`);
      } else {
        console.log(`Super admin ${adminEmail} already exists`);
      }
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const superAdmin = new User({
      name: 'Super Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'super_admin',
      emailVerified: true
    });

    await superAdmin.save();
    console.log(`Super admin created with email: ${adminEmail}`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating super admin:', error);
    process.exit(1);
  }
};

initSuperAdmin();
