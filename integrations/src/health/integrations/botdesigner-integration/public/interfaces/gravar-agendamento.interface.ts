export interface IGravarAgendamento {
  codigoAgendamento?: string;
  codigoAgenda?: string;
  dataAgendamentoInicial: string;
  dataAgendamentoFinal: string;
  codigoUnidade?: string;
  codigoMedico?: string;
  codigoConvenio: string;
  codigoConvenioPlano?: string;
  codigoConvenioCategoria?: string;
  codigoTipoAgendamento: string;
  codigoEspecialidade?: string;
  codigoProcedimento?: string;
  codigoClassificacao?: string;
  pacienteCodigo: string;
  pacienteAltura?: number;
  pacientePeso?: number;
  pacienteGenero?: string;
  pacienteIdade?: string;
}
