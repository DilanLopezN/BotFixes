import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Fallback } from "kissbot-entities";
import { CatchError } from "../../../../utils/catch-error";
import { ANALYTICS_CONNECTION } from "../../consts";

@Injectable()
export class FallbackService {
    constructor(
        @InjectRepository(Fallback, ANALYTICS_CONNECTION)
        private fallbackRepository: Repository<Fallback>,
    ) {}

    @CatchError()
    async _create(fallback: any): Promise<any> {
        return await this.fallbackRepository.insert(fallback);
    }

}