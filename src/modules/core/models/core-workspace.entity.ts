import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class CoreWorkspace {
    @PrimaryColumn()
    id: string;

    @Column({ name: 'ux_employee_id', nullable: true })
    uxEmployeeId?: number;

    @Column({ name: 'cs_employee_id', nullable: true })
    csEmployeeId?: number;

    @Column({ name: 'customer_erp_id', nullable: true })
    customerErpId?: number;

    @Column({ name: 'integration_provider_id', nullable: true })
    integrationProviderId?: number;

    @Column({ name: 'country_state_id', nullable: true })
    countryStateId?: number;

    @Column({ name: 'customer_step_id', nullable: true })
    customerStepId?: number;

    @Column({ name: 'segment_id', nullable: true })
    segmentId?: number;

    @Column({ name: 'functionalities_id', nullable: false, default: [], array: true, type: 'int' })
    functionalitiesId?: number[];

    @Column({ name: 'units', nullable: false, default: [], array: true, type: 'varchar' })
    units?: string[];

    @Column({ name: 'projects_description', nullable: true })
    projectsDescription?: string;

    @Column({ name: 'plan_type', nullable: true })
    planType?: string;

    @Column({ name: 'city', nullable: true })
    city?: string;

    @Column({ name: 'internal_responsible_name', nullable: true })
    internalResponsibleName?: string;

    @Column({ name: 'internal_responsible_email', nullable: true })
    internalResponsibleEmail?: string;

    @Column({ name: 'internal_financial_responsible_name', nullable: true })
    internalFinancialResponsibleName?: string;

    @Column({ name: 'internal_financial_responsible_email', nullable: true })
    internalFinancialResponsibleEmail?: string;

    @Column({ name: 'contract_signed_at', nullable: true })
    contractSignedAt?: Date;

    @Column({ name: 'bot_actived_at', nullable: true })
    botActivedAt?: Date;

    @Column({ name: 'integration_done_at', nullable: true })
    integrationDoneAt?: Date;

    @Column({ name: 'churn_at', nullable: true })
    churnAt?: Date;

    @Column({ name: 'kickoff_at', nullable: true })
    kickoffAt?: Date;

    @Column({ name: 'last_meeting_at', nullable: true })
    lastMeetingAt?: Date;

    @Column({ name: 'implantation_done_at', nullable: true })
    implantationDoneAt?: Date;

    @Column({ name: 'whatsapp_group_link', nullable: true })
    whatsappGroupLink?: string;

    @Column({ name: 'contract_link', nullable: true })
    contractLink?: string;

    @Column({ name: 'implatation_timeline_link', nullable: true })
    implatationTimelineLink?: string;

    @Column({ name: 'research_flow_link', nullable: true })
    researchFlowLink?: string;

    @Column({ name: 'contract_additive_1_link', nullable: true })
    contractAdditive1Link?: string;

    @Column({ name: 'contract_additive_2_link', nullable: true })
    contractAdditive2Link?: string;

    @Column({ name: 'contract_additive_3_link', nullable: true })
    contractAdditive3Link?: string;
}

export interface CreateCoreWorkspaceData extends Omit<CoreWorkspace, 'id'> {}

export interface UpdateCoreWorkspaceData extends CoreWorkspace {}
