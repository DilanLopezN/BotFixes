import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConversationFlow } from "kissbot-entities";
import { Repository } from "typeorm";
import { CatchError } from "../../../../utils/catch-error";
import { ANALYTICS_CONNECTION } from "../../consts";
import { CreateConversationFlowData } from "../interfaces/create-conversation-flow.interface";

@Injectable()
export class ConversationFlowService {
    constructor(
        @InjectRepository(ConversationFlow, ANALYTICS_CONNECTION)
        private repository: Repository<ConversationFlow>,
    ) {}

    @CatchError()
    async createConversationFlow(data: CreateConversationFlowData) {
        return await this.repository.save(data);
    }
}