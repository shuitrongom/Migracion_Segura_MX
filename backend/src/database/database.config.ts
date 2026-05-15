import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isProduction = this.configService.get<string>('app.nodeEnv') === 'production';

    return {
      type: 'postgres',
      host: this.configService.get<string>('database.host'),
      port: this.configService.get<number>('database.port'),
      database: this.configService.get<string>('database.name'),
      username: this.configService.get<string>('database.user'),
      password: this.configService.get<string>('database.password'),
      ssl: this.configService.get<boolean>('database.ssl')
        ? { rejectUnauthorized: false }
        : false,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: !isProduction ? ['query', 'error'] : ['error'],
      autoLoadEntities: true,
    };
  }
}
