import { Test, TestingModule } from '@nestjs/testing';
import { ProdoctorIntegrationService } from './services/prodoctor-integration.service';

describe('ProdoctorIntegrationService', () => {
  let service: ProdoctorIntegrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProdoctorIntegrationService],
    }).compile();

    service = module.get<ProdoctorIntegrationService>(ProdoctorIntegrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
