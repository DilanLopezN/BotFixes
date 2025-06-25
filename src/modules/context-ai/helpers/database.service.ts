import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
    private pool: Pool;

    constructor() {
        this.pool = new Pool({
            connectionString: process.env.POSTGRESQL_URI,
            min: 5,
            max: 5,
        });
    }

    async execute<T>(query: string, params?: any[]): Promise<T> {
        try {
            const result = await this.pool.query(query, params);
            return result.rows as T;
        } catch (err) {
            throw err;
        }
    }

    async onModuleDestroy() {
        await this.pool.end();
    }
}
