import { Entity, Column, Index, BeforeInsert, BeforeUpdate, PrimaryColumn } from 'typeorm';

@Entity('conversation_attribute', { schema: 'conversation' })
export class ConversationAttributeEntity {
    @PrimaryColumn({ name: 'workspace_id', nullable: false })
    workspaceId: string;

    @PrimaryColumn({ name: 'conversation_id', nullable: false })
    conversationId: string;

    @PrimaryColumn({ name: 'attribute_name', nullable: false })
    attributeName: string;

    @Column({ name: 'attribute_value', type: 'jsonb', nullable: true })
    attributeValue: any;

    @Column({ name: 'attribute_label', nullable: true })
    attributeLabel?: string;

    @Column({ name: 'attribute_type', nullable: true })
    attributeType?: string;

    @BeforeInsert()
    @BeforeUpdate()
    cleanAttributeNameField() {
        if (this.attributeName && typeof this.attributeName === 'string') {
            this.attributeName = this.attributeName.replace(/\0/g, '');
            this.attributeName = this.attributeName.replace(/\\u0000/g, '');
            this.attributeName = this.attributeName.replace(/\u0000/g, '');

            let jsonString = JSON.stringify(this.attributeName);
            jsonString = jsonString.replace(/\\u0000/g, '');
            jsonString = jsonString.replace(/\u0000/g, '');
            this.attributeName = JSON.parse(jsonString);

            if (this.attributeName.length > 255) {
                this.attributeName = this.attributeName.slice(0, 255);
            }
        }
    }

    @BeforeInsert()
    @BeforeUpdate()
    cleanAttributeValueField() {
        if (this.attributeValue && typeof this.attributeValue === 'string') {
            this.attributeValue = this.attributeValue.replace(/\0/g, '');
            this.attributeValue = this.attributeValue.replace(/\\u0000/g, '');
            this.attributeValue = this.attributeValue.replace(/\u0000/g, '');

            let jsonString = JSON.stringify(this.attributeValue);
            jsonString = jsonString.replace(/\\u0000/g, '');
            jsonString = jsonString.replace(/\u0000/g, '');
            this.attributeValue = JSON.parse(jsonString);
        }
    }
}

@Index(['workspace_id'])
@Index(['conversation_id'])
@Index(['attribute_name'])
export class ConversationAttributeEntityWithIndex extends ConversationAttributeEntity {}
