process.env.NODE_ENV = 'test';
process.env.ENCRYPTION_KEY = Buffer.alloc(32, 1).toString('base64');
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:55432/testdb';

