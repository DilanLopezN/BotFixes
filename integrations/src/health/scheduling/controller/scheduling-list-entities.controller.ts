import { Controller, Post, Param, Body, ValidationPipe, Injectable, HttpCode, HttpStatus } from '@nestjs/common';
import { SchedulingService } from '../services/scheduling.service';
import { ObjectIdPipe } from 'common/pipes/objectId.pipe';
import { ListAppointmentTypeInputDto, ListAppointmentTypeOutputDto } from '../dto/list-appointment-type.dto';
import { ListDoctorInputDto, ListDoctorOutputDto } from '../dto/list-doctor.dto';
import { ListInsuranceInputDto, ListInsuranceOutputDto } from '../dto/list-insurance.dto';
import { ListInsurancePlanInputDto, ListInsurancePlanOutputDto } from '../dto/list-insurance-plan.dto';
import { ListInsuranceSubPlanInputDto, ListInsuranceSubPlanOutputDto } from '../dto/list-insurance-subplan.dto';
import { ListOccupationAreaInputDto, ListOccupationAreaOutputDto } from '../dto/list-occupation-area.dto';
import { ListOrganizationUnitInputDto, ListOrganizationUnitOutputDto } from '../dto/list-organization-unit.dto';
import {
  ListOrganizationUnitLocationInputDto,
  ListOrganizationUnitLocationOutputDto,
} from '../dto/list-organization-unit-location.dto';
import { ListPlanCategoryInputDto, ListPlanCategoryOutputDto } from '../dto/list-plan-category.dto';
import { ListProcedureInputDto, ListProcedureOutputDto } from '../dto/list-procedure.dto';
import { ListSpecialityInputDto, ListSpecialityOutputDto } from '../dto/list-speciality.dto';
import { ListTypeOfServiceInputDto, ListTypeOfServiceOutputDto } from '../dto/list-type-of-service.dto';
import {
  AppointmentTypeOutput,
  DoctorOutput,
  InsuranceOutput,
  InsurancePlanOutput,
  InsuranceSubPlanOutput,
  OccupationAreaOutput,
  OrganizationUnitLocationOutput,
  OrganizationUnitOutput,
  PlanCategoryOutput,
  ProcedureOutput,
  SpecialityOutput,
  TypeOfServiceOutput,
} from '../interfaces/entities-output.interface';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@Injectable()
// class CorsInterceptor implements NestInterceptor {
//   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
//     const response = context.switchToHttp().getResponse();

//     const origin =
//       process.env.NODE_ENV === 'production' ? 'https://agendamento.botdesigner.io/' : 'http://localhost:8100/';

//     response.setHeader('Access-Control-Allow-Origin', origin);
//     response.setHeader('Access-Control-Allow-Methods', 'POST');
//     response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

//     return next.handle();
//   }
// }

// @UseInterceptors(CorsInterceptor)
@Controller({
  path: 'client/:integrationId/scheduling/list',
})
export class SchedulingListEntitiesController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post('appointmentType')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Scheduling')
  @ApiResponse({ isArray: true, status: 200, type: ListAppointmentTypeOutputDto })
  async getAppointmentTypeEntity(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) listAppointmentTypeDto: ListAppointmentTypeInputDto,
  ): Promise<AppointmentTypeOutput[]> {
    const { params } = listAppointmentTypeDto;
    return this.schedulingService.listAppointmentType(integrationId, params);
  }

  @Post('doctor')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Scheduling')
  @ApiResponse({ isArray: true, status: 200, type: ListDoctorOutputDto })
  async getDoctorEntity(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) listDoctorDto: ListDoctorInputDto,
  ): Promise<DoctorOutput[]> {
    const { params } = listDoctorDto;
    return this.schedulingService.listDoctor(integrationId, params);
  }

  @Post('insurance')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Scheduling')
  @ApiResponse({ isArray: true, status: 200, type: ListInsuranceOutputDto })
  async getInsuranceEntity(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) listInsuranceDto: ListInsuranceInputDto,
  ): Promise<InsuranceOutput[]> {
    const { params } = listInsuranceDto;
    return this.schedulingService.listInsurance(integrationId, params);
  }

  @Post('insurancePlan')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Scheduling')
  @ApiResponse({ isArray: true, status: 200, type: ListInsurancePlanOutputDto })
  async getInsurancePlanEntity(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) listInsurancePlanDto: ListInsurancePlanInputDto,
  ): Promise<InsurancePlanOutput[]> {
    const { params } = listInsurancePlanDto;
    return this.schedulingService.listInsurancePlan(integrationId, params);
  }

  @Post('insuranceSubPlan')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Scheduling')
  @ApiResponse({ isArray: true, status: 200, type: ListInsuranceSubPlanOutputDto })
  async getInsuranceSubPlanEntity(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) listInsuranceSubPlanDto: ListInsuranceSubPlanInputDto,
  ): Promise<InsuranceSubPlanOutput[]> {
    const { params } = listInsuranceSubPlanDto;
    return this.schedulingService.listInsuranceSubPlan(integrationId, params);
  }

  @Post('occupationArea')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Scheduling')
  @ApiResponse({ isArray: true, status: 200, type: ListOccupationAreaOutputDto })
  async getOccupationAreaEntity(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) listOccupationAreaDto: ListOccupationAreaInputDto,
  ): Promise<OccupationAreaOutput[]> {
    const { params } = listOccupationAreaDto;
    return this.schedulingService.listOccupationArea(integrationId, params);
  }

  @Post('organizationUnit')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Scheduling')
  @ApiResponse({ isArray: true, status: 200, type: ListOrganizationUnitOutputDto })
  async getOrganizationUnitEntity(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) listOrganizationUnitDto: ListOrganizationUnitInputDto,
  ): Promise<OrganizationUnitOutput[]> {
    const { params } = listOrganizationUnitDto;
    return this.schedulingService.listOrganizationUnit(integrationId, params);
  }

  @Post('organizationUnitLocation')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Scheduling')
  @ApiResponse({ isArray: true, status: 200, type: ListOrganizationUnitLocationOutputDto })
  async getOrganizationUnitLocationEntity(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) listOrganizationUnitLocationDto: ListOrganizationUnitLocationInputDto,
  ): Promise<OrganizationUnitLocationOutput[]> {
    const { params } = listOrganizationUnitLocationDto;
    return this.schedulingService.listOrganizationUnitLocation(integrationId, params);
  }

  @Post('planCategory')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Scheduling')
  @ApiResponse({ isArray: true, status: 200, type: ListPlanCategoryOutputDto })
  async getPlanCategoryEntity(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) listPlanCategoryDto: ListPlanCategoryInputDto,
  ): Promise<PlanCategoryOutput[]> {
    const { params } = listPlanCategoryDto;
    return this.schedulingService.listPlanCategory(integrationId, params);
  }

  @Post('procedure')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Scheduling')
  @ApiResponse({ isArray: true, status: 200, type: ListProcedureOutputDto })
  async getProcedureEntity(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) listProcedureDto: ListProcedureInputDto,
  ): Promise<ProcedureOutput[]> {
    const { params } = listProcedureDto;
    return this.schedulingService.listProcedure(integrationId, params);
  }

  @Post('speciality')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Scheduling')
  @ApiResponse({ isArray: true, status: 200, type: ListSpecialityOutputDto })
  async getSpecialityEntity(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) listSpecialityDto: ListSpecialityInputDto,
  ): Promise<SpecialityOutput[]> {
    const { params } = listSpecialityDto;
    return this.schedulingService.listSpeciality(integrationId, params);
  }

  @Post('typeOfService')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Scheduling')
  @ApiResponse({ isArray: true, status: 200, type: ListTypeOfServiceOutputDto })
  async getTypeOfServiceEntity(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) listTypeOfServiceDto: ListTypeOfServiceInputDto,
  ): Promise<TypeOfServiceOutput[]> {
    const { params } = listTypeOfServiceDto;
    return this.schedulingService.listTypeOfService(integrationId, params);
  }
}
