import dotenv from 'dotenv';
import path from 'path';

// Load .env.test
dotenv.config({ path: path.resolve(process.cwd(), '.env.test'), override: true });

// Silence logs during tests
// console.log = vi.fn();
// console.error = vi.fn();

// Add global setups or mocks here if needed
process.env.NODE_ENV = 'test';
