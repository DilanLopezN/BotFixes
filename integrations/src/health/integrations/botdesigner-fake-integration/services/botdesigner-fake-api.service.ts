import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import {
  FakeEntity,
  FakeSpeciality,
  FakeInsurance,
  FakeSchedule,
  ScheduledAppointment,
  FakeProcedure,
  FakePatientFilters,
  FakePatientData,
  CreateScheduleResponse,
  CreatePatientResponse,
  PatientScheduleFilters,
  CreateSchedulePayload,
} from '../interface/entities';
import { OkResponse } from '../interface/ok-response';
import { BotdesignerFakePatient } from '../entities/botdesigner-fake-patient.entity';
import { BotdesignerFakeAppointment } from '../entities/botdesigner-fake-appointment.entity';
import { BOTDESIGNER_FAKE_CONNECTION_NAME } from '../../../ormconfig';
import * as moment from 'moment';
import { nanoid } from 'nanoid';

@Injectable()
export class BotdesignerFakeApiService {
  constructor(
    @InjectRepository(BotdesignerFakePatient, BOTDESIGNER_FAKE_CONNECTION_NAME)
    private readonly patientRepository: Repository<BotdesignerFakePatient>,
    @InjectRepository(BotdesignerFakeAppointment, BOTDESIGNER_FAKE_CONNECTION_NAME)
    private readonly appointmentRepository: Repository<BotdesignerFakeAppointment>,
  ) {}

  async getScheduledAppointments(integration: IntegrationDocument): Promise<ScheduledAppointment[]> {
    const appointments = await this.appointmentRepository.find({
      where: {
        integrationId: integration._id.toString(),
      },
      order: {
        scheduleDate: 'ASC',
      },
    });

    return appointments.map((apt) => ({
      scheduleCode: apt.scheduleCode,
      patientCode: apt.patientCode || '',
      doctorCode: apt.doctorCode || '',
      scheduleDate: moment(apt.scheduleDate).format('YYYY-MM-DDTHH:mm:ss'),
      duration: apt.duration,
      status: apt.status as 'scheduled' | 'confirmed' | 'cancelled',
      createdAt: new Date(apt.createdAt),
    }));
  }

  async addScheduledAppointment(integration: IntegrationDocument, appointment: ScheduledAppointment): Promise<void> {
    const now = Date.now();

    const appointmentEntity = this.appointmentRepository.create({
      integrationId: integration._id.toString(),
      scheduleCode: appointment.scheduleCode,
      patientCode: appointment.patientCode,
      doctorCode: appointment.doctorCode,
      scheduleDate: new Date(appointment.scheduleDate),
      duration: appointment.duration,
      status: appointment.status || 'scheduled',
      procedureCode: appointment.procedureCode,
      specialityCode: appointment.specialityCode,
      insuranceCode: appointment.insuranceCode,
      organizationUnitCode: appointment.organizationUnitCode,
      appointmentTypeCode: appointment.appointmentTypeCode,
      typeOfServiceCode: appointment.typeOfServiceCode,
      insurancePlanCode: appointment.insurancePlanCode,
      insuranceCategoryCode: appointment.insuranceCategoryCode,
      insuranceSubPlanCode: appointment.insuranceSubPlanCode,
      createdAt: now,
      updatedAt: now,
    });

    await this.appointmentRepository.save(appointmentEntity);
  }

  async updateScheduledAppointment(
    integration: IntegrationDocument,
    scheduleCode: string,
    status: 'confirmed' | 'cancelled',
  ): Promise<boolean> {
    const appointment = await this.appointmentRepository.findOne({
      where: {
        integrationId: integration._id.toString(),
        scheduleCode: scheduleCode,
      },
    });

    if (!appointment) {
      return false;
    }

    if (status === 'cancelled') {
      await this.appointmentRepository.remove(appointment);
    } else {
      appointment.status = status;
      appointment.updatedAt = Date.now();
      await this.appointmentRepository.save(appointment);
    }

    return true;
  }

  async deleteScheduledAppointment(integration: IntegrationDocument, scheduleCode: string): Promise<boolean> {
    const appointment = await this.appointmentRepository.findOne({
      where: {
        integrationId: integration._id.toString(),
        scheduleCode: scheduleCode,
      },
    });

    if (!appointment) {
      return false;
    }

    await this.appointmentRepository.remove(appointment);
    return true;
  }

  async getFakeSpecialities(appointmentTypeCode?: string): Promise<FakeSpeciality[]> {
    const allSpecialities = [
      // Especialidades para Consulta (C)
      { code: '1', name: 'Cardiologia', active: true, canSchedule: true, canView: true, specialityType: 'C' },
      { code: '2', name: 'Dermatologia', active: true, canSchedule: true, canView: true, specialityType: 'C' },
      { code: '3', name: 'Neurologia', active: true, canSchedule: true, canView: true, specialityType: 'C' },
      { code: '4', name: 'Ortopedia', active: true, canSchedule: true, canView: true, specialityType: 'C' },
      { code: '5', name: 'Endocrinologia', active: true, canSchedule: true, canView: true, specialityType: 'C' },
      { code: '6', name: 'Clínica Médica', active: true, canSchedule: true, canView: true, specialityType: 'C' },
      { code: '7', name: 'Ginecologia', active: true, canSchedule: true, canView: true, specialityType: 'C' },
      // Especialidades para Exame (E)
      { code: '8', name: 'Radiologia', active: true, canSchedule: true, canView: true, specialityType: 'E' },
      { code: '9', name: 'Ultrassonografia', active: true, canSchedule: true, canView: true, specialityType: 'E' },
      { code: '10', name: 'Tomografia', active: true, canSchedule: true, canView: true, specialityType: 'E' },
      {
        code: '11',
        name: 'Ressonância Magnética',
        active: true,
        canSchedule: true,
        canView: true,
        specialityType: 'E',
      },
      { code: '12', name: 'Laboratório', active: true, canSchedule: true, canView: true, specialityType: 'E' },
      { code: '13', name: 'Ecocardiograma', active: true, canSchedule: true, canView: true, specialityType: 'E' },
      { code: '14', name: 'Endoscopia', active: true, canSchedule: true, canView: true, specialityType: 'E' },
    ];

    // Filtrar por appointmentType se fornecido
    if (appointmentTypeCode) {
      return allSpecialities.filter((spec) => spec.specialityType === appointmentTypeCode);
    }

    return allSpecialities;
  }

  async getFakeInsurances(): Promise<FakeInsurance[]> {
    return [
      { code: '1', name: 'Unimed', active: true, canSchedule: true, canView: true },
      { code: '2', name: 'Bradesco Saúde', active: true, canSchedule: true, canView: true },
      { code: '3', name: 'Amil', active: true, canSchedule: true, canView: true },
      { code: '4', name: 'SulAmérica', active: true, canSchedule: true, canView: true },
      { code: '5', name: 'Particular', active: true, canSchedule: true, canView: true },
      { code: '6', name: 'Assefaz', active: true, canSchedule: true, canView: true },
      { code: '7', name: 'Cassi', active: true, canSchedule: true, canView: true },
    ];
  }

  async getFakeDoctors(): Promise<FakeEntity[]> {
    return [
      { code: '1', name: 'João Silva', active: true, canSchedule: true, canView: true },
      { code: '2', name: 'Maria Santos', active: true, canSchedule: true, canView: true },
      { code: '3', name: 'Carlos Oliveira', active: true, canSchedule: true, canView: true },
      { code: '4', name: 'Ana Costa', active: true, canSchedule: true, canView: true },
      { code: '5', name: 'Pedro Lima', active: true, canSchedule: true, canView: true },
      { code: '6', name: 'Fernanda Ribeiro', active: true, canSchedule: true, canView: true },
      { code: '7', name: 'Daniel Alberto', active: true, canSchedule: true, canView: true },
    ];
  }

  async getFakeOrganizationUnits(): Promise<FakeEntity[]> {
    return [
      { code: '1', name: 'Unidade Central', active: true, canSchedule: true, canView: true },
      { code: '2', name: 'Unidade Norte', active: true, canSchedule: true, canView: true },
    ];
  }

  async getFakeAppointmentTypes(): Promise<FakeEntity[]> {
    return [
      { code: 'C', name: 'Consulta', active: true, canSchedule: true, canView: true },
      { code: 'E', name: 'Exame', active: true, canSchedule: true, canView: true },
    ];
  }

  async getFakeProcedures(specialityCode?: string): Promise<FakeProcedure[]> {
    const allProcedures: FakeProcedure[] = [
      // Consultas - Especialidades de Consulta (1-7)
      {
        code: '1',
        name: 'Consulta Cardiológica',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '1',
        specialityType: 'C',
      },
      {
        code: '3',
        name: 'Consulta Dermatológica',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '2',
        specialityType: 'C',
      },
      {
        code: '5',
        name: 'Consulta Neurológica',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '3',
        specialityType: 'C',
      },
      {
        code: '7',
        name: 'Consulta Ortopédica',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '4',
        specialityType: 'C',
      },
      {
        code: '9',
        name: 'Consulta Endocrinológica',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '5',
        specialityType: 'C',
      },
      {
        code: '11',
        name: 'Consulta Clínica Médica',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '6',
        specialityType: 'C',
      },
      {
        code: '13',
        name: 'Consulta Ginecológica',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '7',
        specialityType: 'C',
      },

      // Exames - Radiologia (8)
      {
        code: '15',
        name: 'Raio-X de Tórax',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '8',
        specialityType: 'E',
      },
      {
        code: '16',
        name: 'Raio-X de Coluna',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '8',
        specialityType: 'E',
      },
      {
        code: '17',
        name: 'Raio-X de Membros',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '8',
        specialityType: 'E',
      },

      // Exames - Ultrassonografia (9)
      {
        code: '18',
        name: 'Ultrassom Abdominal',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '9',
        specialityType: 'E',
      },
      {
        code: '19',
        name: 'Ultrassom Pélvico',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '9',
        specialityType: 'E',
      },
      {
        code: '20',
        name: 'Ultrassom Transvaginal',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '9',
        specialityType: 'E',
      },

      // Exames - Tomografia (10)
      {
        code: '21',
        name: 'Tomografia de Crânio',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '10',
        specialityType: 'E',
      },
      {
        code: '22',
        name: 'Tomografia de Tórax',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '10',
        specialityType: 'E',
      },
      {
        code: '23',
        name: 'Tomografia de Abdomen',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '10',
        specialityType: 'E',
      },

      // Exames - Ressonância Magnética (11)
      {
        code: '24',
        name: 'Ressonância de Crânio',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '11',
        specialityType: 'E',
      },
      {
        code: '25',
        name: 'Ressonância de Coluna',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '11',
        specialityType: 'E',
      },
      {
        code: '26',
        name: 'Ressonância de Joelho',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '11',
        specialityType: 'E',
      },

      // Exames - Laboratório (12)
      {
        code: '27',
        name: 'Hemograma Completo',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '12',
        specialityType: 'E',
      },
      {
        code: '28',
        name: 'Glicemia de Jejum',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '12',
        specialityType: 'E',
      },
      {
        code: '29',
        name: 'Perfil Lipídico',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '12',
        specialityType: 'E',
      },

      // Exames - Ecocardiograma (13)
      {
        code: '30',
        name: 'Ecocardiograma Transtorácico',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '13',
        specialityType: 'E',
      },
      {
        code: '31',
        name: 'Ecocardiograma com Doppler',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '13',
        specialityType: 'E',
      },
      {
        code: '32',
        name: 'Ecocardiograma de Estresse',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '13',
        specialityType: 'E',
      },

      // Exames - Endoscopia (14)
      {
        code: '33',
        name: 'Endoscopia Digestiva Alta',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '14',
        specialityType: 'E',
      },
      {
        code: '34',
        name: 'Colonoscopia',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '14',
        specialityType: 'E',
      },
      {
        code: '35',
        name: 'Retossigmoidoscopia',
        active: true,
        canSchedule: true,
        canView: true,
        specialityCode: '14',
        specialityType: 'E',
      },
    ];

    if (specialityCode) {
      return allProcedures.filter((proc) => proc.specialityCode === specialityCode);
    }

    return allProcedures;
  }

  async getFakeOrganizationUnitLocations(): Promise<FakeEntity[]> {
    return [
      { code: '1', name: 'Térreo', active: true, canSchedule: true, canView: true },
      { code: '2', name: '1º Andar', active: true, canSchedule: true, canView: true },
      { code: '3', name: '2º Andar', active: true, canSchedule: true, canView: true },
    ];
  }

  async getFakeAvailableSchedules(availableSchedules: any): Promise<FakeSchedule[]> {
    const schedules: FakeSchedule[] = [];
    const { limit = 100, fromDay = 1, untilDay = 30, period, periodOfDay, filter } = availableSchedules;

    const startDate = moment().add(fromDay, 'day');
    const maxDays = Math.min(untilDay - fromDay, 60); // Limitar a 60 dias

    // Usar códigos dos filtros ou valores padrão
    const insuranceCode = filter?.insurance?.code || '1';
    const appointmentTypeCode = filter?.appointmentType?.code || 'C';
    const specialityCode = filter?.speciality?.code;
    const doctorCode = filter?.doctor?.code;
    const organizationUnitCode = filter?.organizationUnit?.code || '1';
    const procedureCode = filter?.procedure?.code || '1';

    // Determinar horários baseado no período do dia
    let startHour = 9;
    let endHour = 18;

    if (periodOfDay === 'morning') {
      startHour = 9;
      endHour = 12;
    } else if (periodOfDay === 'afternoon') {
      startHour = 13;
      endHour = 18;
    } else if (periodOfDay === 'night') {
      startHour = 19;
      endHour = 22;
    }

    // Usar período específico se fornecido
    if (period?.start && period?.end) {
      const startTime = moment(period.start, 'HH:mm');
      const endTime = moment(period.end, 'HH:mm');

      if (startTime.isValid() && endTime.isValid()) {
        startHour = startTime.hour();
        endHour = endTime.hour();

        // Garantir que não seja madrugada
        if (startHour < 7) startHour = 9;
        if (endHour > 22) endHour = 18;
        if (endHour <= startHour) endHour = startHour + 1;
      }
    }

    let generatedCount = 0;

    for (let day = 0; day < maxDays && generatedCount < limit; day++) {
      const date = startDate.clone().add(day, 'days');

      for (let hour = startHour; hour < endHour && generatedCount < limit; hour++) {
        // Se doctor específico foi filtrado, usar apenas ele
        const doctorCodes = doctorCode ? [doctorCode] : ['1', '2', '3', '4', '5'];

        for (const docCode of doctorCodes) {
          if (generatedCount >= limit) break;

          const scheduleDate = date.clone().hour(hour).minute(0).second(0);

          // Se speciality específica foi filtrada, usar apenas ela
          const scheduleSpecialityCode = specialityCode || ((parseInt(docCode) % 7) + 1).toString();

          schedules.push({
            scheduleCode: `FAKE_${scheduleDate.format('YYYYMMDD')}_${hour}_${docCode}_${nanoid(6)}`,
            scheduleDate: scheduleDate.format('YYYY-MM-DDTHH:mm:ss'),
            duration: 30,
            doctorCode: docCode,
            organizationUnitCode,
            specialityCode: scheduleSpecialityCode,
            insuranceCode,
            appointmentTypeCode,
            procedureCode,
            status: 'available',
          });

          generatedCount++;
        }

        if (generatedCount >= limit) break;
      }

      if (generatedCount >= limit) break;
    }

    return schedules.slice(0, limit);
  }

  async createSchedule(
    integration: IntegrationDocument,
    payload: CreateSchedulePayload,
  ): Promise<CreateScheduleResponse> {
    const appointment: ScheduledAppointment = {
      scheduleCode: payload.data.scheduleCode,
      patientCode: payload.data.patientCode,
      doctorCode: payload.data.doctorCode,
      scheduleDate: payload.data.scheduleDate,
      duration: payload.data.duration,
      status: 'scheduled',
      createdAt: new Date(),
      procedureCode: payload.data.procedureCode,
      specialityCode: payload.data.specialityCode,
      insuranceCode: payload.data.insuranceCode,
      organizationUnitCode: payload.data.organizationUnitCode,
      appointmentTypeCode: payload.data.appointmentTypeCode,
      typeOfServiceCode: payload.data.typeOfServiceCode,
      insurancePlanCode: payload.data.insurancePlanCode,
      insuranceCategoryCode: payload.data.insuranceCategoryCode,
      insuranceSubPlanCode: payload.data.insuranceSubPlanCode,
      patientInsuranceNumber: payload.data.patientInsuranceNumber,
      patientHeight: payload.data.patientHeight,
      patientWeight: payload.data.patientWeight,
    };

    await this.addScheduledAppointment(integration, appointment);

    return {
      scheduleCode: payload.data.scheduleCode,
      ok: true,
    };
  }

  async confirmSchedule(integration: IntegrationDocument, payload: { scheduleCode: string }): Promise<OkResponse> {
    const updated = await this.updateScheduledAppointment(integration, payload.scheduleCode, 'confirmed');
    return { ok: updated };
  }

  async cancelSchedule(integration: IntegrationDocument, payload: { scheduleCode: string }): Promise<OkResponse> {
    const deleted = await this.deleteScheduledAppointment(integration, payload.scheduleCode);
    return { ok: deleted };
  }

  async getPatient(integration: IntegrationDocument, params: FakePatientFilters): Promise<FakePatientData | null> {
    const patientCode = params.params.code;
    const cpf = params.params.cpf;

    if (!patientCode && !cpf) {
      return null;
    }

    const whereConditions: Partial<BotdesignerFakePatient> = {
      integrationId: integration._id.toString(),
    };

    if (patientCode) {
      whereConditions.erpCode = patientCode;
    } else if (cpf) {
      whereConditions.cpf = cpf;
    }

    const patient = await this.patientRepository.findOne({
      where: whereConditions,
    });

    if (!patient) {
      return null;
    }

    return {
      code: patient.erpCode,
      name: patient.name,
      cpf: patient.cpf,
      phone: patient.phone,
      email: patient.email,
      bornDate: patient.bornDate,
      sex: patient.sex,
      motherName: patient.motherName,
    };
  }

  async createPatient(
    integration: IntegrationDocument,
    payload: { data: FakePatientData },
  ): Promise<CreatePatientResponse> {
    const patientData = payload.data;
    const now = Date.now();

    const patient = this.patientRepository.create({
      integrationId: integration._id.toString(),
      erpCode: `FAKE_PATIENT_${Math.random().toString(36).substring(2, 11)}`,
      name: patientData.name,
      cpf: patientData.cpf,
      phone: patientData.phone,
      email: patientData.email,
      bornDate: patientData.bornDate,
      sex: patientData.sex,
      motherName: patientData.motherName,
      createdAt: now,
      updatedAt: now,
    });

    const savedPatient = await this.patientRepository.save(patient);

    return {
      patientCode: savedPatient.erpCode,
      ok: true,
    };
  }

  async updatePatient(
    integration: IntegrationDocument,
    payload: { data: FakePatientData },
  ): Promise<CreatePatientResponse> {
    const patientData = payload.data;
    const now = Date.now();

    const patient = await this.patientRepository.findOne({
      where: {
        integrationId: integration._id.toString(),
        erpCode: patientData.code,
      },
    });

    if (!patient) {
      return {
        ok: false,
        error: 'Patient not found',
      };
    }

    await this.patientRepository.update(patient.id, {
      name: patientData.name || patient.name,
      cpf: patientData.cpf || patient.cpf,
      phone: patientData.phone || patient.phone,
      email: patientData.email || patient.email,
      bornDate: patientData.bornDate || patient.bornDate,
      sex: patientData.sex || patient.sex,
      motherName: patientData.motherName || patient.motherName,
      updatedAt: now,
    });

    return {
      patientCode: patientData.code,
      ok: true,
    };
  }

  async listPatientSchedules(
    integration: IntegrationDocument,
    filters: PatientScheduleFilters,
  ): Promise<ScheduledAppointment[]> {
    const patientCode = filters.params.code;
    const now = new Date();

    const appointments = await this.appointmentRepository.find({
      where: {
        integrationId: integration._id.toString(),
        patientCode: patientCode,
        scheduleDate: MoreThan(now),
      },
      order: {
        scheduleDate: 'ASC',
      },
    });

    return appointments.map((apt) => ({
      scheduleCode: apt.scheduleCode,
      patientCode: apt.patientCode,
      scheduleDate: moment(apt.scheduleDate).format('YYYY-MM-DDTHH:mm:ss'),
      duration: apt.duration,
      doctorCode: apt.doctorCode,
      organizationUnitCode: apt.organizationUnitCode || '1',
      specialityCode: apt.specialityCode || '1',
      insuranceCode: apt.insuranceCode || '1',
      appointmentTypeCode: apt.appointmentTypeCode || 'C',
      status: apt.status as 'scheduled' | 'confirmed' | 'cancelled',
      createdAt: new Date(apt.createdAt),
      procedureCode: apt.procedureCode,
      typeOfServiceCode: apt.typeOfServiceCode,
      insurancePlanCode: apt.insurancePlanCode,
      insuranceCategoryCode: apt.insuranceCategoryCode,
      insuranceSubPlanCode: apt.insuranceSubPlanCode,
    }));
  }

  async getAppointmentsByDateRange(
    integration: IntegrationDocument,
    startDate: Date,
    endDate: Date,
  ): Promise<BotdesignerFakeAppointment[]> {
    return await this.appointmentRepository.find({
      where: {
        integrationId: integration._id.toString(),
        scheduleDate: Between(startDate, endDate),
      },
      order: {
        scheduleDate: 'ASC',
      },
    });
  }
}
