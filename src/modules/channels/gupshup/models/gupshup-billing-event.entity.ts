import { GupshupMessageType } from "kissbot-core";
import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class GupshupBillingEvent {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'conversation_id', nullable: true })
    conversationId?: string;

    @Column({ name: 'workspace_id', nullable: true })
    workspaceId?: string;

    @Column({ name: 'channel_config_token' })
    channelConfigToken: string;

    // campo GS deductions.type
    @Column({ name: 'deduction_type' })
    deductionType: string;

    // campo GS deductions.model
    @Column({ name: 'deduction_model' })
    deductionModel: string;

    // campo GS deductions.source
    @Column({ name: 'deduction_source' })
    deductionSource: string;

    // campo GS reference.id
    @Column({ name: 'reference_id' })
    referenceId: string;

    // campo GS reference.gsId
    @Column({ name: 'reference_gs_id' })
    referenceGsId: string;

    // campo GS reference.conversationId
    @Column({ name: 'reference_conversation_id' })
    referenceConversationId: string;

    // campo GS reference.destination
    @Column({ name: 'reference_destination' })
    referenceDestination: string;

    @Column({ name: 'billable' })
    billable: boolean;

    @Column({ name: 'category' })
    category: string;

    @Column({ type: 'bigint', name: 'created_at' })
    createdAt: number;

    @Column({ type: 'bigint', name: 'gs_timestamp' })
    gsTimestamp: number;

    // EXEMPLO DE PAYLOAD do gupshup
    // {
    //     "app": "DemoAPI",
    //     "timestamp": 1580546677791,
    //     "version": 2,
    //     "type": "billing-event",
    //     "payload": {
    //       "deductions": {
    //         "type": "FEP/UIC/BIC",
    //         "model": "NBP/CBP",
    //         "source": "whatsapp"
    //       },billable
    //       "references": {
    //         "id": "59f8db90c37e-4408-90ab-cc54ef8246ad",
    //         "gsId": "ee4a68a0-1203-4c85-8dc3-49d0b3226a35",
    //         "conversationId": "532b57b5f6e63595ccd74c6010e5c5c7",
    //         "destination": "91XX985XX10X"
    //       }
    //     }
    // }
}
