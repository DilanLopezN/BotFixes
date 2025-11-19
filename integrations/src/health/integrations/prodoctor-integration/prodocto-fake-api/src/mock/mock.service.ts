import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { realisticMocks } from '../db-mocks';

@Injectable()
export class MockService {
  swagger: any;

  constructor() {
    const swaggerPath = path.join(process.cwd(), 'swagger.json');
    this.swagger = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
  }

  getSuccessStatus(responses: any = {}) {
    const codes = Object.keys(responses);
    const success = codes.find((c) => c.startsWith('2'));
    return success ? parseInt(success, 10) : 200;
  }

  getCustomMock(method: string, swaggerRoute: string, req: any) {
    const key = `${method} ${swaggerRoute}`;
    return realisticMocks[key]?.(req) ?? null;
  }

  buildDefaultMock(swaggerRoute: string, method: string, req: any) {
    return {
      message: 'Mock ProDoctor - resposta automática a partir do Swagger',
      method,
      swaggerRoute,
      params: req.params,
      query: req.query,
      body: req.body,
    };
  }
}
