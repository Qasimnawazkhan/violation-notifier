import cron from 'node-cron';
import { main as runPoller } from './imapPoller';

// Runs every 15 minutes
cron.schedule('*/15 * * * *', () => {
  console.log('Running IMAP poller...');
  runPoller();
});