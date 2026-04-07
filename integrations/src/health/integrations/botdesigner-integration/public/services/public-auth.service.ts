import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { BotdesignerPublicAuthToken } from '../entities/botdesigner-public-auth-token.entity';
import { INTEGRATIONS_CONNECTION_NAME } from '../../../../ormconfig';

@Injectable()
export class PublicAuthService {
  constructor(
    @InjectRepository(BotdesignerPublicAuthToken, INTEGRATIONS_CONNECTION_NAME)
    private readonly publicAuthTokenRepository: Repository<BotdesignerPublicAuthToken>,
  ) {}

  async validateToken(token: string): Promise<BotdesignerPublicAuthToken | null> {
    const authToken = await this.publicAuthTokenRepository.findOne({
      where: { token, isActive: true },
    });

    return authToken || null;
  }

  async createToken(integrationId: string, token: string): Promise<BotdesignerPublicAuthToken> {
    const authToken = this.publicAuthTokenRepository.create({
      token,
      integrationId,
      isActive: true,
    });

    return await this.publicAuthTokenRepository.save(authToken);
  }

  async deactivateToken(token: string): Promise<void> {
    await this.publicAuthTokenRepository.update({ token }, { isActive: false });
  }

  async createTokenWithAutoGeneration(integrationId: string): Promise<BotdesignerPublicAuthToken> {
    const generatedToken = uuidv4();

    const authToken = this.publicAuthTokenRepository.create({
      token: generatedToken,
      integrationId,
      isActive: true,
    });

    return await this.publicAuthTokenRepository.save(authToken);
  }
}
