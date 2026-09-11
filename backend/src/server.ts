import { app } from './app';
import { ENV } from './config/env';
import { prisma } from './config/db';

const PORT = Number(ENV.PORT) || 5000;

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL database.');

    app.listen(PORT, () => {
      console.log(`SplitEase backend running on http://localhost:${PORT}`);
      console.log(`Health check at: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
