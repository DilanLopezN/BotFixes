import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IIntentLibrary } from '../interfaces/intent-library.interface';

@Entity({ name: 'intent_library' })
export class IntentLibrary implements IIntentLibrary {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'name', nullable: false })
    name: string;

    @Column({ name: 'description', nullable: false })
    description: string;

    @Column({ name: 'examples', type: 'jsonb', nullable: false })
    examples: string[];

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({
        name: 'updated_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    })
    updatedAt: Date;

    @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt: Date;
}
