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
    private _activeMessageHealthCheckService: ActiveMessageHealthCheckService;
    private _privacyPolicyHealthCheckService: PrivacyPolicyHealthCheckService;
    private _ratingHealthCheckService: RatingHealthCheckService;
    private _runnerHealthCheckService: RunnerHealthCheckService;
    private _conversationHealthCheckService: ConversationHealthCheckService;
    private _analyticsReadHealthCheckService: AnalyticsReadHealthCheckService;
    private _analyticsHealthCheckService: AnalyticsHealthCheckService;
    private _internalAnalyticsHealthCheckService: InternalAnalyticsHealthCheckService;
    private _autoAssignHealthCheckService: AutoAssignHealthCheckService;
    private _billingHealthCheckService: BillingHealthCheckService;
    private _campaignHealthCheckService: CampaignHealthCheckService;
    private _gupshupHealthCheckService: GupshupHealthCheckService;
    private _coreHealthCheckService: CoreHealthCheckService;
    private _setupHealthCheckService: SetupHealthCheckService;

    constructor(private readonly moduleRef: ModuleRef) {}

    private get activeMessageHealthCheckService(): ActiveMessageHealthCheckService {
        if (!this._activeMessageHealthCheckService) {
            this._activeMessageHealthCheckService = this.moduleRef.get<ActiveMessageHealthCheckService>(
                ActiveMessageHealthCheckService,
                { strict: false },
            );
        }
        return this._activeMessageHealthCheckService;
    }

    private get privacyPolicyHealthCheckService(): PrivacyPolicyHealthCheckService {
        if (!this._privacyPolicyHealthCheckService) {
            this._privacyPolicyHealthCheckService = this.moduleRef.get<PrivacyPolicyHealthCheckService>(
                PrivacyPolicyHealthCheckService,
                { strict: false },
            );
        }
        return this._privacyPolicyHealthCheckService;
    }

    private get ratingHealthCheckService(): RatingHealthCheckService {
        if (!this._ratingHealthCheckService) {
            this._ratingHealthCheckService = this.moduleRef.get<RatingHealthCheckService>(RatingHealthCheckService, {
                strict: false,
            });
        }
        return this._ratingHealthCheckService;
    }

    private get runnerHealthCheckService(): RunnerHealthCheckService {
        if (!this._runnerHealthCheckService) {
            this._runnerHealthCheckService = this.moduleRef.get<RunnerHealthCheckService>(RunnerHealthCheckService, {
                strict: false,
            });
        }
        return this._runnerHealthCheckService;
    }

    private get conversationHealthCheckService(): ConversationHealthCheckService {
        if (!this._conversationHealthCheckService) {
            this._conversationHealthCheckService = this.moduleRef.get<ConversationHealthCheckService>(
                ConversationHealthCheckService,
                { strict: false },
            );
        }
        return this._conversationHealthCheckService;
    }

    private get analyticsReadHealthCheckService(): AnalyticsReadHealthCheckService {
        if (!this._analyticsReadHealthCheckService) {
            this._analyticsReadHealthCheckService = this.moduleRef.get<AnalyticsReadHealthCheckService>(
                AnalyticsReadHealthCheckService,
                { strict: false },
            );
        }
        return this._analyticsReadHealthCheckService;
    }

    private get analyticsHealthCheckService(): AnalyticsHealthCheckService {
        if (!this._analyticsHealthCheckService) {
            this._analyticsHealthCheckService = this.moduleRef.get<AnalyticsHealthCheckService>(
                AnalyticsHealthCheckService,
                { strict: false },
            );
        }
        return this._analyticsHealthCheckService;
    }

    private get internalAnalyticsHealthCheckService(): InternalAnalyticsHealthCheckService {
        if (!this._internalAnalyticsHealthCheckService) {
            this._internalAnalyticsHealthCheckService = this.moduleRef.get<InternalAnalyticsHealthCheckService>(
                InternalAnalyticsHealthCheckService,
                {
                    strict: false,
                },
            );
        }
        return this._internalAnalyticsHealthCheckService;
    }

    private get autoAssignHealthCheckService(): AutoAssignHealthCheckService {
        if (!this._autoAssignHealthCheckService) {
            this._autoAssignHealthCheckService = this.moduleRef.get<AutoAssignHealthCheckService>(
                AutoAssignHealthCheckService,
                { strict: false },
            );
        }
        return this._autoAssignHealthCheckService;
    }

    private get billingHealthCheckService(): BillingHealthCheckService {
        if (!this._billingHealthCheckService) {
            this._billingHealthCheckService = this.moduleRef.get<BillingHealthCheckService>(BillingHealthCheckService, {
                strict: false,
            });
        }
        return this._billingHealthCheckService;
    }

    private get campaignHealthCheckService(): CampaignHealthCheckService {
        if (!this._campaignHealthCheckService) {
            this._campaignHealthCheckService = this.moduleRef.get<CampaignHealthCheckService>(CampaignHealthCheckService, {
                strict: false,
            });
        }
        return this._campaignHealthCheckService;
    }

    private get gupshupHealthCheckService(): GupshupHealthCheckService {
        if (!this._gupshupHealthCheckService) {
            this._gupshupHealthCheckService = this.moduleRef.get<GupshupHealthCheckService>(GupshupHealthCheckService, {
                strict: false,
            });
        }
        return this._gupshupHealthCheckService;
    }

    private get coreHealthCheckService(): CoreHealthCheckService {
        if (!this._coreHealthCheckService) {
            this._coreHealthCheckService = this.moduleRef.get<CoreHealthCheckService>(CoreHealthCheckService, {
                strict: false,
            });
        }
        return this._coreHealthCheckService;
    }

    private get setupHealthCheckService(): SetupHealthCheckService {
        if (!this._setupHealthCheckService) {
            this._setupHealthCheckService = this.moduleRef.get<SetupHealthCheckService>(SetupHealthCheckService, {
                strict: false,
            });
        }
        return this._setupHealthCheckService;
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
        ];
        const result = await Promise.all(promises);
        const hasError = !!result.find(status => !status);
        return !hasError;
    }
}
