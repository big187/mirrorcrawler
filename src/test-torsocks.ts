import dotenv from 'dotenv';
import { Dashboard } from './dashboard';
import { TorsocksAutomationScript } from './automation-torsocks';

// Load environment variables
dotenv.config();

console.log('Testing Torsocks automation...');

const dashboard = new Dashboard();
const automation = new TorsocksAutomationScript(dashboard);

automation.run()
    .then(() => {
        console.log('Torsocks automation completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Torsocks automation failed:', error);
        process.exit(1);
    });