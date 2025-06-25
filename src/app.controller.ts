import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
    @Get()
    redirect(@Res() res: Response): void {
        return res.redirect('https://botdesigner.io/');
    }
}
