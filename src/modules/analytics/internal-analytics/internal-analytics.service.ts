import { Injectable, Logger } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Repository } from "typeorm";
import { ANALYTICS_CONNECTION } from "../ormconfig";
import * as moment from 'moment';
import { WorkspaceUserService } from "../../workspace-user/workspace-user.service";
import { CatchError } from "../../auth/exceptions";
import { InjectRepository } from "@nestjs/typeorm";
import { CustomerResume } from "kissbot-entities";
import { INTERNAL_ANALYTICS_CONNECTION } from "./conn";
import { UserRoles } from "kissbot-core";

@Injectable()
export class InternalAnalyticsService {

    private readonly logger = new Logger(InternalAnalyticsService.name);
    constructor(
        @InjectConnection(ANALYTICS_CONNECTION)
        private connection: Connection,
        private readonly workspaceUserService: WorkspaceUserService,
        @InjectRepository(CustomerResume, INTERNAL_ANALYTICS_CONNECTION)
        private customerResumeRepository: Repository<CustomerResume>,
    ) {}

    @CatchError()
    async getClientResume(billingMonth: string): Promise<any[]> {
        const month = parseInt(billingMonth.split('/')[0]);
        const year = parseInt('20' + billingMonth.split('/')[1]);
        const startDate = moment().month(month - 1).year(year).startOf('month');
        const endDate = moment().month(month - 1).year(year).endOf('month');
        let result = await this.connection.query(`
            SELECT 
                ww.id,
                acc.company AS cliente,
                ww.plan_price AS preco_plano,
                (
                    SELECT
                        COUNT(cc.id) 
                    FROM analytics.conversation_view AS cc
                    WHERE cc.workspace_id = ww.id
                    AND cc.created_at >= ${startDate.valueOf()}
                    AND cc.created_at < ${endDate.valueOf()}
                ) AS atendimentos,
                ww.plan_conversation_limit AS atendimento_plano,
                pay.billing_end_date as end_date,
                pay.billing_start_date as start_date,
                0 AS mensagens,
                ww.plan_message_limit AS mensagens_plano,
                0 AS hsm,
                ww.plan_hsm_message_limit AS hsm_plano
            FROM billing.payment AS pay
            INNER JOIN billing.workspace AS ww on ww.id = pay.workspace_id
            INNER JOIN billing.account AS acc on acc.id = ww.account_id
            WHERE pay.billing_month = '${billingMonth}';
        `);

        result = result.map(async (element) => {
            const query = {
                filter: {
                    $and: [
                        {
                            "roles.$.role": {
                                $nin: [UserRoles.WORKSPACE_INACTIVE]
                            }
                        }
                    ]
                }
            }
            let users = await this.workspaceUserService.getAllWorkspaceUser(query, element.id)

            return {
                ...element,
                users: users.count
            }
        })
        result = await Promise.all(result);
        return result;
    }

    async cronClientResume(billingMonth?: string) {
        if (!billingMonth) {
            billingMonth = moment().subtract(1, 'month').format('MM/YY');
        }
        const resumes = await this.getClientResume(billingMonth);
        for(const resume of resumes) {
            try {
                await this.customerResumeRepository.insert({
                    id: resume.id,
                    billingMonth,
                    workspaceName: resume.cliente,
                    planPrice: resume.preco_plano,
                    conversations: resume.atendimentos,
                    conversationPlan: resume.atendimento_plano,
                    messages: resume.mensagens,
                    messagesPlan: resume.mensagens_plano,
                    hsm: resume.hsm,
                    hsmPlan: resume.hsm_plano,
                    userCount: resume.users,
                    billingEndDate: moment(Number(String(resume.end_date))).toDate(),
                    billingStartDate: moment(Number(String(resume.start_date))).toDate(),
                })
            } catch (e) {
                this.logger.error('cronClientResume', e);
            }
        }
    } 

    async getPlatformResume(startDate: number, endDate: number): Promise<number> {
      
        let result = await this.connection.query(`
            SELECT
                ww.name,
                cc.id,
                cc.metrics_assignment_at,
                cc.metrics_close_at,
                to_timestamp(cc.created_at / 1000) as created_at,
                cc.metrics_time_to_agent_reply,
                cc.metrics_time_to_close,
                rat.value
            FROM analytics.conversation_view AS cc
            INNER JOIN billing.workspace AS ww ON ww.id = cc.workspace_id
            LEFT JOIN rating.rating AS rat ON rat.conversation_id = cc.id
            WHERE cc.created_at >= ${startDate}
            AND cc.created_at <= ${endDate}
            ;
        `);
        
        return result;
    }
}