import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { InternalAnalyticsService } from './internal-analytics.service';
import { Parser } from 'json2csv';
import { Response } from 'express';
import * as moment from 'moment';
import * as stream from 'stream';
import { AuthGuard } from './../../auth/guard/auth.guard';
import { PredefinedRoles } from './../../../common/utils/utils';
import { RolesDecorator } from './../../users/decorators/roles.decorator';
import { RolesGuard } from './../../users/guards/roles.guard';
@Controller('internal-analytics')
@UseGuards(AuthGuard)
export class InternalAnalyticsController {
    constructor(
        private readonly internalAnalyticsService: InternalAnalyticsService,
    ) {}
    @Get('/client-resume')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
    ])
    @UseGuards(RolesGuard)
    async getClientResume(
        @Query('billingMonth') billingMonth: string,
        @Res() res: Response
    ) {
        return await this.internalAnalyticsService.cronClientResume(billingMonth);
        // let result: any = await this.internalAnalyticsService.getClientResume(billingMonth);
        // const fields = [];
        
        // const opts = { fields };

        // try { 
        //     const dataCsv = result?.map((element) => {
        //         return {
        //             "Workspace": element.cliente,
        //             "Usuários": element.users,
        //             "Plano": element.mensagens_plano,
        //             "Mensagens": element.mensagens === null ? '0' : element.mensagens,
        //             "Limite de atendimentos": element.atendimento_plano === null ? '0' : element.atendimento_plano,
        //             "Atendimentos": element.atendimentos === null ? '0' : element.atendimentos,
        //             "Limite HSM": element.hsm_plano === null ? '0' : element.hsm_plano,
        //             "HSM": element.hsm === null ? '0' : element.hsm,
        //             "Valor do plano": element.preco_plano
        //         }
        //     })

        //     const json2csvParser = new Parser();
        //     const csv = json2csvParser.parse(dataCsv);
        //     var fileContents = Buffer.from(csv);
  
        //     var readStream = new stream.PassThrough();
        //     readStream.end(fileContents);

        //     res.set('Content-disposition', 'attachment; filename=Resumo-clientes.csv');
        //     res.set('Content-Type', 'text/csv');

        //     readStream.pipe(res);
        // } catch (err) {
        //     console.error('InternalAnalyticsController.getClientResume', err);
        // }
    }

    @Get('/platform-resume')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
    ])
    @UseGuards(RolesGuard)
    async getPlatformResume(
        @Res() res: Response,
        @Query('startDate') startDate: number,
        @Query('endDate') endDate: number,
    ) {
        try { 
            let result: any = await this.internalAnalyticsService.getPlatformResume(startDate, endDate);
            const fields = [];
            const opts = { fields };
            const getRandomInt = (max) => {
                return Math.floor(Math.random() * max);
            }
            const cat = ['Olhos', 'Gastrica', 'Cardiologista']
            const dataCsv = result?.map((element) => {
                return {
                    'Id': element.id,
                    'Cliente': element.name,
                    'Categorias do cliente': [cat[getRandomInt(3)], cat[getRandomInt(3)]].toString(),
                    'Assinado em': element.metrics_assignment_at,
                    'Fechado em': element.metrics_close_at,
                    'Tempo de resposta do agente': element.metrics_time_to_agent_reply,
                    'Criado em': element.created_at,
                    'Avaliação': element.value,
                    'Duração': element.metrics_time_to_close,
                }
            })

            const json2csvParser = new Parser();
            const csv = json2csvParser.parse(dataCsv);
            var fileContents = Buffer.from(csv);
  
            var readStream = new stream.PassThrough();
            readStream.end(fileContents);

            res.set(
                'Content-disposition',
                `attachment; filename=Resumo-plataforma-${moment(startDate).format('DD-MM-YYYY')}-${moment(endDate).format('DD-MM-YYYY')}.csv`,
            );
            res.set('Content-Type', 'text/csv');

            readStream.pipe(res);
        } catch (err) {
            console.error('InternalAnalyticsController.getPlatformResume', err);
        }
    }
}
