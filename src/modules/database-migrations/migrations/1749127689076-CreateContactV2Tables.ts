import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContactV2Tables1749127689076 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "conversation"."contact" (
                "id" varchar(255) PRIMARY KEY,
                "phone" varchar(200),
                "ddi" varchar(5),
                "telegram" varchar(255),
                "email" varchar(255),
                "name" varchar(255),
                "conversations" text[],
                "webchat_id" varchar(255),
                "created_by_channel" varchar(50) NOT NULL,
                "workspace_id" varchar(255) NOT NULL,
                "whatsapp" varchar(200),
                "blocked_by" varchar(255),
                "blocked_at" bigint,
                "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
                "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_contact_workspace_id" ON "conversation"."contact" ("workspace_id")`);

        await queryRunner.query(`
            CREATE INDEX "IDX_contact_workspace_phone" 
            ON "conversation"."contact" ("workspace_id", "phone") 
            WHERE "phone" IS NOT NULL
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_contact_workspace_email" 
            ON "conversation"."contact" ("workspace_id", "email") 
            WHERE "email" IS NOT NULL
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_contact_workspace_whatsapp" 
            ON "conversation"."contact" ("workspace_id", "whatsapp") 
            WHERE "whatsapp" IS NOT NULL
        `);

        await queryRunner.query(`
            CREATE TABLE "conversation"."blocked_contact" (
                "id" varchar(255) PRIMARY KEY,
                "workspace_id" varchar(255) NOT NULL,
                "contact_id" varchar(255) NOT NULL,
                "phone" varchar(200) NOT NULL,
                "whatsapp" varchar(200) NOT NULL,
                "blocked_by" varchar(255) NOT NULL,
                "blocked_at" bigint NOT NULL,
                "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
                "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await queryRunner.query(
            `CREATE INDEX "IDX_blocked_contact_workspace_id" ON "conversation"."blocked_contact" ("workspace_id")`,
        );

        await queryRunner.query(
            `CREATE INDEX "IDX_blocked_contact_contact_id" ON "conversation"."blocked_contact" ("contact_id")`,
        );

        await queryRunner.query(`
            CREATE INDEX "IDX_blocked_contact_workspace_phone" 
            ON "conversation"."blocked_contact" ("workspace_id", "phone")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_blocked_contact_workspace_whatsapp" 
            ON "conversation"."blocked_contact" ("workspace_id", "whatsapp")
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_blocked_contact_workspace_contact_unique" 
            ON "conversation"."blocked_contact" ("workspace_id", "contact_id")
        `);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION "conversation"."fnc_before_insert_contact"()
              RETURNS trigger
              LANGUAGE plpgsql AS
            $func$
            BEGIN
              BEGIN
                EXECUTE format('INSERT INTO "conversation"."contact_%s" SELECT $1.*', NEW.workspace_id)
                USING NEW;
              EXCEPTION
                WHEN undefined_table THEN
                  EXECUTE format('CREATE TABLE "conversation"."contact_%s" ( CHECK ( workspace_id = %s ), LIKE "conversation"."contact" INCLUDING INDEXES) INHERITS ("conversation"."contact")', NEW.workspace_id, quote_literal(NEW.workspace_id));

                  EXECUTE format('INSERT INTO "conversation"."contact_%s" SELECT $1.*', NEW.workspace_id)
                  USING NEW;
              END;

              RETURN null;
            END
            $func$;
        `);

        await queryRunner.query(`
            CREATE TRIGGER trg_before_insert_contact
              BEFORE INSERT ON "conversation"."contact"
              FOR EACH ROW
              EXECUTE FUNCTION "conversation"."fnc_before_insert_contact"();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS trg_before_insert_contact ON "conversation"."contact";`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS "conversation"."fnc_before_insert_contact"();`);

        await queryRunner.query(`DROP INDEX IF EXISTS "conversation"."IDX_contact_workspace_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "conversation"."IDX_contact_workspace_phone"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "conversation"."IDX_contact_workspace_email"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "conversation"."IDX_contact_workspace_whatsapp"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "conversation"."IDX_contact_telegram"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "conversation"."IDX_contact_email"`);

        await queryRunner.query(`DROP INDEX IF EXISTS "conversation"."IDX_blocked_contact_workspace_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "conversation"."IDX_blocked_contact_contact_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "conversation"."IDX_blocked_contact_whatsapp"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "conversation"."IDX_blocked_contact_workspace_phone"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "conversation"."IDX_blocked_contact_workspace_whatsapp"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "conversation"."IDX_blocked_contact_workspace_contact_unique"`);

        await queryRunner.query(`DROP TABLE "conversation"."blocked_contact" CASCADE`);
        await queryRunner.query(`DROP TABLE "conversation"."contact" CASCADE`);
    }
}
