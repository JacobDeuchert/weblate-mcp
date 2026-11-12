import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Containers terminate via SIGTERM; let Nest run its shutdown hooks.
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');

  Logger.log(
    `Weblate MCP server listening on http://0.0.0.0:${port}/mcp`,
    'Bootstrap',
  );
}

void bootstrap();
