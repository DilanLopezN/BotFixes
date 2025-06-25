import * as dotenv from 'dotenv';

export interface EnvConfig {
  [prop: string]: string;
}

export class ConfigService {
  public readonly envConfig: EnvConfig;

  constructor() {
    dotenv.config({ path: '../.env' });
    dotenv.config();
    this.envConfig = process.env;
  }

  get(key: string): string {
    return this.envConfig[key];
  }
}