import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ActiveMessageHealthCheckService } from '../active-message/services/active-message-health-check.service';
import { PrivacyPolicyHealthCheckService } from '../privacy-policy/services/privacy-policy-health-check.service';
import { RatingHealthCheckService } from '../rating/services/rating-health-check.service';
import { RunnerHealthCheckService } from '../runner-manager/services/runner-health-check.service';
import { ConversationHealthCheckService } from '../activity-v2/services/conversation-health-check.service';
import { AnalyticsReadHealthCheckService } from '../analytics/conversation-analytics/services/analytics-read-health-check.service';
import { AnalyticsHealthCheckService } from '../analytics/conversation-analytics/services/analytics-health-check.service';
import { InternalAnalyticsHealthCheckService } from '../analytics/internal-analytics/internal-analytics-health-check.service';
import { AutoAssignHealthCheckService } from '../auto-assign/services/auto-assign-health-check.service';
import { BillingHealthCheckService } from '../billing/services/billing-health-check.service';
import { CampaignHealthCheckService } from '../campaign/services/campaign-health-check.service';
import { GupshupHealthCheckService } from '../channels/gupshup/services/gupshup-health-check.service';
import { CoreHealthCheckService } from '../core/services/core-health-check.service';
import { SetupHealthCheckService } from '../setup/services/setup-health-check.service';

@Injectable()
export class ExternalDataService {
    private activeMessageHealthCheckService: ActiveMessageHealthCheckService;
    private privacyPolicyHealthCheckService: PrivacyPolicyHealthCheckService;
    private ratingHealthCheckService: RatingHealthCheckService;
    private runnerHealthCheckService: RunnerHealthCheckService;
    private conversationHealthCheckService: ConversationHealthCheckService;
    private analyticsReadHealthCheckService: AnalyticsReadHealthCheckService;
    private analyticsHealthCheckService: AnalyticsHealthCheckService;
    private internalAnalyticsHealthCheckService: InternalAnalyticsHealthCheckService;
    private autoAssignHealthCheckService: AutoAssignHealthCheckService;
    private billingHealthCheckService: BillingHealthCheckService;
    private campaignHealthCheckService: CampaignHealthCheckService;
    private gupshupHealthCheckService: GupshupHealthCheckService;
    private coreHealthCheckService: CoreHealthCheckService;
    private setupHealthCheckService: SetupHealthCheckService;

    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.activeMessageHealthCheckService = this.moduleRef.get<ActiveMessageHealthCheckService>(
            ActiveMessageHealthCheckService,
            { strict: false },
        );
        this.privacyPolicyHealthCheckService = this.moduleRef.get<PrivacyPolicyHealthCheckService>(
            PrivacyPolicyHealthCheckService,
            { strict: false },
        );
        this.ratingHealthCheckService = this.moduleRef.get<RatingHealthCheckService>(RatingHealthCheckService, {
            strict: false,
        });
        this.runnerHealthCheckService = this.moduleRef.get<RunnerHealthCheckService>(RunnerHealthCheckService, {
            strict: false,
        });
        this.conversationHealthCheckService = this.moduleRef.get<ConversationHealthCheckService>(
            ConversationHealthCheckService,
            { strict: false },
        );
        this.analyticsReadHealthCheckService = this.moduleRef.get<AnalyticsReadHealthCheckService>(
            AnalyticsReadHealthCheckService,
            { strict: false },
        );
        this.analyticsHealthCheckService = this.moduleRef.get<AnalyticsHealthCheckService>(
            AnalyticsHealthCheckService,
            { strict: false },
        );
        this.internalAnalyticsHealthCheckService = this.moduleRef.get<InternalAnalyticsHealthCheckService>(
            InternalAnalyticsHealthCheckService,
            {
                strict: false,
            },
        );
        this.autoAssignHealthCheckService = this.moduleRef.get<AutoAssignHealthCheckService>(
            AutoAssignHealthCheckService,
            { strict: false },
        );
        this.billingHealthCheckService = this.moduleRef.get<BillingHealthCheckService>(BillingHealthCheckService, {
            strict: false,
        });
        this.campaignHealthCheckService = this.moduleRef.get<CampaignHealthCheckService>(CampaignHealthCheckService, {
            strict: false,
        });
        this.gupshupHealthCheckService = this.moduleRef.get<GupshupHealthCheckService>(GupshupHealthCheckService, {
            strict: false,
        });
        this.coreHealthCheckService = this.moduleRef.get<CoreHealthCheckService>(CoreHealthCheckService, {
            strict: false,
        });
        this.setupHealthCheckService = this.moduleRef.get<SetupHealthCheckService>(SetupHealthCheckService, {
            strict: false,
        });
    }

    async checkConnectionsPsql() {
        const promises = [
            this.activeMessageHealthCheckService.ping(),
            this.privacyPolicyHealthCheckService.ping(),
            this.ratingHealthCheckService.ping(),
            this.runnerHealthCheckService.ping(),
            this.conversationHealthCheckService.ping(),
            this.analyticsReadHealthCheckService.ping(),
            this.analyticsHealthCheckService.ping(),
            this.internalAnalyticsHealthCheckService.ping(),
            this.autoAssignHealthCheckService.ping(),
            this.billingHealthCheckService.ping(),
            this.campaignHealthCheckService.ping(),
            this.gupshupHealthCheckService.ping(),
            this.coreHealthCheckService.ping(),
            this.setupHealthCheckService.ping(),
        ]
        const result = await Promise.all(promises);
        const hasError = !!result.find(status => !status);
        return !hasError;
    }
}
