import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Member } from 'kissbot-entities';
import { Repository } from 'typeorm';
import { ANALYTICS_CONNECTION } from '../../ormconfig';

@Injectable()
export class MemberService {
    constructor(
        @InjectRepository(Member, ANALYTICS_CONNECTION)
        private memberRepository: Repository<Member>,
    ) {}

    async updateConversationMember(member: Member) {
        try {
            return await this.memberRepository.update(
                {
                    conversationId: member.conversationId,
                    memberId: member.memberId,
                },
                {
                    channelId: member.channelId,
                    data: member.data,
                    disabled: member.disabled ? 1 : 0,
                    memberId: member.memberId,
                    name: member.name,
                    type: member.type,
                },
            );
        } catch (e) {
            console.log('MemberService.updateConversationMember', e);
            throw e;
        }
    }

    async createMember(member: Member) {
        try {
            return await this.memberRepository.insert(member);
        } catch (e) {
            console.log('MemberService.createMember', e);
            throw e;
        }
    }
}
