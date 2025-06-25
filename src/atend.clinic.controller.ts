import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import axios from 'axios';

@Controller()
export class AtendClinicController {
    @Get('/b/:shortId')
    async redirectIntegrations(@Req() req: Request, @Res() res: Response) {
        const defaultRedirect = 'https://botdesigner.io/';

        try {
            const { params } = req;
            const baseUrl = process.env.INTEGRATIONS_URI;

            const response = await axios.get(`${baseUrl}/b/${params.shortId}`);
            const { path } = response.data;

            return res.redirect(path || defaultRedirect);
        } catch (error) {
            return res.redirect(error?.response?.data?.path || defaultRedirect);
        }
    }
}
