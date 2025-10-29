import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { Teams } from '../models/teams.entity';
import { Templates } from '../models/templates.entity';
import { Users } from '../models/users.entity';
import { CORE_CONNECTION } from '../ormconfig';
import { shouldRunCron } from '../../../common/utils/bootstrapOptions';

@Injectable()
export class MongoToPostgresSyncService {
    private readonly logger = new Logger(MongoToPostgresSyncService.name);

    constructor(
        @InjectRepository(Teams, CORE_CONNECTION)
        private readonly teamsRepository: Repository<Teams>,
        @InjectRepository(Templates, CORE_CONNECTION)
        private readonly templatesRepository: Repository<Templates>,
        @InjectRepository(Users, CORE_CONNECTION)
        private readonly usersRepository: Repository<Users>,
        @InjectModel('User')
        private readonly userModel: Model<any>,
        @InjectModel('Team')
        private readonly teamModel: Model<any>,
        @InjectModel('TemplateMessage')
        private readonly templateMessageModel: Model<any>,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_5AM)
    async handleCronSync() {
        if (!shouldRunCron()) return;

        this.logger.log('Iniciando sincronização MongoDB -> PostgreSQL');

        try {
            await this.syncUsers();
            await this.syncTeams();
            await this.syncTemplates();

            this.logger.log('Sincronização concluída com sucesso');
        } catch (error) {
            this.logger.error('Erro na sincronização:', error);
            throw error;
        }
    }

    private async syncUsers() {
        try {
            this.logger.log('Sincronizando users...');

            // Deletar dados existentes
            await this.usersRepository.delete({});

            // Buscar dados do MongoDB
            const users = await this.userModel.find({}).lean();
            let count = 0;

            for (const user of users) {
                try {
                    await this.usersRepository.save({
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                    });

                    count++;
                    if (count % 15 === 0) {
                        this.logger.log(`Sincronizados ${count} users`);
                    }
                } catch (error) {
                    this.logger.error(`Erro ao salvar user ${user._id}:`, error);
                }
            }

            this.logger.log(`Total de users sincronizados: ${count}`);
        } catch (error) {
            this.logger.error('Erro ao sincronizar users:', error);
            throw error;
        }
    }

    private async syncTeams() {
        try {
            this.logger.log('Sincronizando teams...');

            // Deletar dados existentes
            await this.teamsRepository.delete({});

            // Buscar dados do MongoDB
            const teams = await this.teamModel.find({}).lean();
            let count = 0;

            for (const team of teams) {
                try {
                    await this.teamsRepository.save({
                        id: team._id.toString(),
                        name: team.name,
                        workspaceId: team.workspaceId?.toString(),
                    });

                    count++;
                    if (count % 15 === 0) {
                        this.logger.log(`Sincronizados ${count} teams`);
                    }
                } catch (error) {
                    this.logger.error(`Erro ao salvar team ${team._id}:`, error);
                }
            }

            this.logger.log(`Total de teams sincronizados: ${count}`);
        } catch (error) {
            this.logger.error('Erro ao sincronizar teams:', error);
            throw error;
        }
    }

    private async syncTemplates() {
        try {
            this.logger.log('Sincronizando templates...');

            // Deletar dados existentes
            await this.templatesRepository.delete({});

            // Buscar dados do MongoDB
            const templates = await this.templateMessageModel.find({}).lean();
            let count = 0;

            for (const template of templates) {
                try {
                    if (template.wabaResult) {
                        for (const key of Object.keys(template.wabaResult)) {
                            const wabaResult = template.wabaResult[key];

                            if (wabaResult?.status === 'approved') {
                                await this.templatesRepository.save({
                                    templateId: template._id.toString(),
                                    name: template.name?.replace(/'/g, ' ') || null,
                                    category: wabaResult.category || null,
                                    appName: wabaResult.appName || null,
                                    channelConfigId: wabaResult.channelConfigId || null,
                                    workspaceId: template.workspaceId?.toString() || null,
                                    wabaTemplateId: wabaResult.wabaTemplateId || null,
                                    elementName: wabaResult.elementName || null,
                                    active: !!template.active,
                                });

                                count++;
                                if (count % 15 === 0) {
                                    this.logger.log(`Sincronizados ${count} templates`);
                                }
                            }
                        }
                    }
                } catch (error) {
                    this.logger.error(`Erro ao salvar template ${template._id}:`, error);
                }
            }

            this.logger.log(`Total de templates sincronizados: ${count}`);
        } catch (error) {
            this.logger.error('Erro ao sincronizar templates:', error);
            throw error;
        }
    }

    // Método público para executar sincronização manualmente se necessário
    async syncAll() {
        this.logger.log('Iniciando sincronização manual');
        await this.handleCronSync();
    }
}
