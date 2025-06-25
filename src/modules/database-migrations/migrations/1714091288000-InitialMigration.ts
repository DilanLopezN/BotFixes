import { MigrationInterface, QueryRunner } from "typeorm";

// Example migration
export class InitialMigration1714091288000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add your migration logic here
        // Example:
        // await queryRunner.query(`CREATE TABLE "example" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add your rollback logic here
        // Example:
        // await queryRunner.query(`DROP TABLE "example"`);
    }
}
