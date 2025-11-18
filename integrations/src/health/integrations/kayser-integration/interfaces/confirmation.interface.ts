import { ScheduleType } from '../../../entities/schema';

export interface KayserConfirmOrCancelScheduleParamsRequest {
  codigoHorario: string;
  codigoPaciente: string;
}

export interface KayserConfirmOrCancelScheduleResponse {
  ok?: true;
  codigoErro?: string;
  erro?: string;
}

export interface KayserListSchedulesParamsRequest {
  codigoPaciente: number;
  dataInicioBusca: string;
  dataFimBusca: string;
  status?: string;
}

interface CodeAndName {
  codigo: string;
  nome: string;
}

interface KayserDoctor extends CodeAndName {}
interface KayserProcedure extends CodeAndName {}
interface KayserInsurance extends CodeAndName {}
interface KayserPlan extends CodeAndName {}
interface KayserSubPlan extends CodeAndName {}
interface KayserOrganizationUnit extends CodeAndName {
  endereco: string;
}
interface KayserPatient {
  codigoPaciente: string;
  nome: string;
  celular: string;
  telefone: string;
  email: string;
}

export interface KayserSchedule {
  codigoHorario: string;
  status: string;
  dataHorario: string;
  unidade: KayserOrganizationUnit;
  tipo_agendamento: ScheduleType;
  medico: KayserDoctor;
  procedimento: KayserProcedure;
  convenio: KayserInsurance;
  plano: KayserPlan;
  subPlano: KayserSubPlan;
  paciente: KayserPatient;
  preparo: string;
}

export type KayserListSchedulesResponse = KayserSchedule[];
