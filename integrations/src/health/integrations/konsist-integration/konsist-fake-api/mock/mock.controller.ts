import { Controller, All, Req, Res } from '@nestjs/common';
import { MockService } from './mock.service';
import { Request, Response } from 'express';

@Controller()
export class MockController {
  constructor(private readonly mockService: MockService) {}

  @All('*')
  handleAll(@Req() req: Request, @Res() res: Response) {
    const { method, path } = req;
    const swagger = this.mockService.swagger;

    // Valida Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'Token de autorização não fornecido',
      });
    }

    // Tenta encontrar a rota no swagger.json
    const match = Object.entries(swagger.paths).find(([swaggerRoute]) => {
      // Converte {id}, {:idconvenio}, {cpf} para regex
      const routeRegex = new RegExp('^' + swaggerRoute.replace(/{:?([^}]+)}/g, '([^/]+)') + '$');
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
    const methodSwagger = (methods as any)[methodLower];

    if (!methodSwagger) {
      return res.status(405).json({
        error: true,
        message: `Método ${method} não permitido para ${swaggerRoute}`,
      });
    }

    // Status de sucesso padrão da rota
    const successStatus = this.mockService.getSuccessStatus(methodSwagger.responses);

    // Extrai parâmetros de path
    const routeRegex = new RegExp('^' + swaggerRoute.replace(/{:?([^}]+)}/g, '(?<$1>[^/]+)') + '$');
    const pathMatch = path.match(routeRegex);
    if (pathMatch?.groups) {
      req.params = { ...req.params, ...pathMatch.groups };
    }

    // Busca mock customizado
    const customMock = this.mockService.getCustomMock(method, swaggerRoute, req);

    // null = 404 (recurso não encontrado)
    if (customMock === null) {
      return res.status(404).json({
        error: true,
        message: 'Recurso não encontrado',
      });
    }

    // undefined = usar mock padrão
    if (customMock === undefined) {
      const defaultMock = this.mockService.buildDefaultMock(swaggerRoute, method, req);
      return res.status(successStatus).json(defaultMock);
    }

    // Retorna mock customizado
    return res.status(successStatus).json(customMock);
  }
}
