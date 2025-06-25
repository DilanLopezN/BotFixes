import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TemplateMessageDto } from '../../template-message/dto/template-message.dto';
import { Flow } from './flow.entity';
import { FlowCategory } from './flow-category.entity';
import { FlowVariable } from '../interfaces/flow.interface';

@Entity()
export class WhatsappFlowLibrary {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'name' })
    name: string;

    @Column({ name: 'friendly_name' })
    friendlyName: string;

    @Column({ name: 'flow_category_ids', type: 'numeric', array: true })
    flowCategoryIds: number[];

    @Column({ name: 'flow_json', type: 'jsonb' })
    flowJSON: Record<string, any>;

    @Column({ name: 'variables_of_flow_data', type: 'jsonb', nullable: true })
    variablesOfFlowData?: FlowVariable[];

    @Column({ name: 'template_message_data', type: 'jsonb', nullable: true })
    templateMessageData?: Partial<TemplateMessageDto>;

    @Column({ name: 'flow_fields', type: 'jsonb' })
    flowFields: Record<string, any>;

    @Column({ name: 'flow_preview_data', type: 'jsonb' })
    flowPreviewData?: Record<string, any>;

    // campos que podem vir junto com join
    flows?: Flow[];
    flowCategories?: FlowCategory[] | string[];
}
