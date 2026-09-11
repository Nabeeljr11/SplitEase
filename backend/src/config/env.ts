import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;
const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

if (isProduction && (!databaseUrl || !accessSecret || !refreshSecret)) {
  throw new Error(
    'DATABASE_URL, JWT_ACCESS_SECRET, and JWT_REFRESH_SECRET are required in production'
  );
}

export const ENV = {
  PORT: process.env.PORT || '5000',
  DATABASE_URL: databaseUrl || 'postgresql://postgres@127.0.0.1:5433/splitease?schema=public',
  JWT_ACCESS_SECRET: accessSecret || 'splitease_access_secret_super_secure_key_12345',
  JWT_REFRESH_SECRET: refreshSecret || 'splitease_refresh_secret_super_secure_key_67890',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PROD: isProduction,
};
