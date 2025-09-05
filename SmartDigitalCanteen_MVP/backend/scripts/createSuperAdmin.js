// scripts/createSuperAdmin.js (NEW FILE)
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    
    if (existingSuperAdmin) {
      console.log('❌ Super admin already exists:', existingSuperAdmin.email);
      process.exit(1);
    }

    const superAdmin = await User.create({
      username: 'superadmin',
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@canteen.com',
      password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!',
      role: 'super_admin',
      isActive: true
    });

    console.log('✅ Super admin created successfully:', superAdmin.email);
    console.log('🔐 Make sure to change the default password after first login!');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();
