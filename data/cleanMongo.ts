import 'dotenv/config';
import { mongoDbManager, cleanDuplicateData } from './mongo.ts';
import mongoose from 'mongoose';

async function main() {
  console.log('🚀 Running MongoDB Atlas duplicate cleanup utility...');
  const connected = await mongoDbManager.connect();
  if (!connected) {
    console.error('Failed to connect to MongoDB. Check MONGODB_URI in your .env file.');
    process.exit(1);
  }

  const result = await cleanDuplicateData();
  console.log('✨ Cleanup finished successfully:', result);
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
  process.exit(0);
}

main().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});

