require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User     = require('../models/User');

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected');

  const exists = await User.findOne({ role: 'admin' });
  if (exists) {
    console.log('ℹ️  Admin already exists:', exists.email);
  } else {
    await User.create({
      firstName:  'مدير',
      lastName:   'النظام',
      email:      process.env.ADMIN_EMAIL,
      password:   process.env.ADMIN_PASSWORD,
      phone:      '+218000000000',
      university: 'الاتحاد',
      major:      'إدارة',
      studentId:  'ADMIN-001',
      role:       'admin',
      status:     'active',
      isVerified: true,
    });
    console.log('✅ Admin created!');
    console.log('   Email   :', process.env.ADMIN_EMAIL);
    console.log('   Password:', process.env.ADMIN_PASSWORD);
    console.log('   Secret  :', process.env.ADMIN_SECRET_KEY);
  }

  await mongoose.disconnect();
  console.log('✅ Done! Now run: npm run dev');
  process.exit(0);
}

seed().catch(err => { console.error('❌', err.message); process.exit(1); });
