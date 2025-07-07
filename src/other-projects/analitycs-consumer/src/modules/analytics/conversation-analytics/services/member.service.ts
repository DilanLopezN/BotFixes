import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Member } from 'kissbot-entities';
import { Repository } from 'typeorm';
import { ANALYTICS_CONNECTION } from '../../consts';
import * as Sentry from '@sentry/node';

@Injectable()
export class MemberService {
  private readonly logger = new Logger(MemberService.name);
  constructor(
    @InjectRepository(Member, ANALYTICS_CONNECTION)
    private memberRepository: Repository<Member>,
  ) {}

  async updateConversationMember(member: Member) {
    try {
      if (!member.memberId) {
        return;
      }
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
      console.log(`${MemberService.name}.updateConversationMember`, e);
      Sentry.captureEvent({
        message: `${MemberService.name}.updateConversationMember`,
        extra: {
          error: e,
          member,
        },
      });
      // throw e;
    }
  }

  async createMember(member: Member) {
    try {
      if (!member.memberId) {
        return;
      }
      return await this.memberRepository.insert(member);
    } catch (e) {
      console.log(`${MemberService.name}.createMember`, e);
      Sentry.captureEvent({
        message: `${MemberService.name}.createMember`,
        extra: {
          error: e,
          member,
        },
      });
      // throw e;
    }
  }

  async updateNameMemberByMemberIdAndType(
    memberId: string,
    name: string,
    type?: string,
  ) {
    try {
      if (!memberId) return;
      const memberType = type || 'agent';

      return await this.memberRepository.update(
        {
          memberId: memberId,
          type: memberType,
        },
        {
          name: name,
        },
      );
    } catch (e) {
      console.log(`${MemberService.name}.updateNameMemberByMemberId`, e);
      Sentry.captureEvent({
        message: `${MemberService.name}.updateNameMemberByMemberIdAndType`,
        extra: {
          error: e,
          memberId,
          name,
        },
      });
      // throw e;
    }
  }
}
