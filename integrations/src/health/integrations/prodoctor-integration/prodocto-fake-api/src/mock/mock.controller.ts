import { Controller, All, Req, Res, Next } from '@nestjs/common';
import { MockService } from './mock.service';
import { Request, Response } from 'express';

@Controller()
export class MockController {
  constructor(private readonly mockService: MockService) {}

  @All('*')
  handleAll(@Req() req: Request, @Res() res: Response) {
    const { method, path } = req;
    const swagger = this.mockService.swagger;

    // Tenta encontrar a rota no swagger.json
    const match = Object.entries(swagger.paths).find(([swaggerRoute]) => {
      // converte {id} para regex amigável
      const routeRegex = new RegExp('^' + swaggerRoute.replace(/{([^}]+)}/g, '([^/]+)') + '$');

      return routeRegex.test(path);
    });

    if (!match) {
      return res.status(404).json({
        error: true,
        message: 'Rota não encontrada no Swagger',
        path,
      });
    }

    const [swaggerRoute, methods] = match;

    const methodLower = method.toLowerCase();
    const methodSwagger = methods[methodLower];

    if (!methodSwagger) {
      return res.status(405).json({
        error: true,
        message: `Método ${method} não encontrado no Swagger para ${swaggerRoute}`,
      });
    }

    // Descobre status de sucesso padrão
    const successStatus = this.mockService.getSuccessStatus(methodSwagger.responses);

    // Verifica mocks customizados
    const custom = this.mockService.getCustomMock(method, swaggerRoute, req);

    if (custom) {
      return res.status(successStatus).json(custom);
    }

    // Mock padrão
    const payload = this.mockService.buildDefaultMock(swaggerRoute, method, req);

    return res.status(successStatus).json(payload);
  }
}
