
import { AdminService } from '../services/admin';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log('Testing AdminService.getStats()...');
  try {
    const stats = await AdminService.getStats();
    console.log('Success:', JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('Error fetching admin stats:', error);
  }
}

main();
