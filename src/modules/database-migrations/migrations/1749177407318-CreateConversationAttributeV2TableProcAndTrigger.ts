import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConversationAttributeV2TableProcAndTrigger1749177407318 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "conversation"."conversation_attribute" (
                workspace_id VARCHAR(255) NOT NULL,
                conversation_id VARCHAR(255) NOT NULL,
                attribute_name VARCHAR(255) NOT NULL,
                attribute_value JSONB,
                attribute_label VARCHAR(255),
                attribute_type VARCHAR(50),
                CONSTRAINT unique_conversation_attribute UNIQUE(workspace_id, conversation_id, attribute_name)
            ) PARTITION BY LIST (workspace_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_conversation_attribute_conversation_id_hash ON "conversation"."conversation_attribute" USING hash (conversation_id);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "conversation"."idx_conversation_attribute_conversation_id_hash";
        `);
    }
}
