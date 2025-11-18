interface MatrixOrganizationUnitsResponse {
  unidades: {
    unidade_id: string;
    unidade_nome: string;
    unidade_endereco: string;
    numero: string;
    bairro: string;
    UF: string;
    telefone: string;
    cep: string;
    coordenadas: string;
  }[];
}

interface MatrixOrganizationUnitsParamsRequest {
  insuranceCode?: string;
  insurancePlanCode?: string;
  specialityCode: string;
  procedureCode?: string;
  doctorCode?: string;
  pickUpRegionCode?: string;
}

interface MatrixOrganizationUnitsPayloadRequest {
  convenio_id?: string;
  plano_id?: string;
  setor_id: string;
  procedimento_id?: string;
  codigoRegiaoColeta?: string;
  responsavel_id?: string;
}

interface MatrixInsurancesAndPlansResponse {
  convenios: {
    convenio_id: string;
    convenio_nome: string;
    ativo: boolean;
    ativoWeb: boolean;
    planos: {
      plano_id: string;
      plano_nome: string;
      ativo: boolean;
    }[];
  }[];
}

interface MatrixInsurancesPlansResponse {
  convenio_id: string;
  plano_id: string;
  plano_nome: string;
  ativo: boolean;
}
[];

interface MatrixDoctorParamsRequest {
  insuranceCode?: string;
  insurancePlanCode?: string;
  specialityCode?: string;
  procedureCode?: string;
}

interface MatrixDoctorPayloadRequest {
  convenio_id?: string;
  plano_id?: string;
  setor_id?: string;
  procedimento_id?: string;
  codigoRegiaoColeta?: string;
}

interface MatrixDoctorResponse {
  responsaveis: {
    responsavel_id: string;
    responsavel_nome: string;
  }[];
}

interface MatrixSpecialitiesResponse {
  setores: {
    setor_id: string;
    setor_nome: string;
    ativo: string;
    procedimentos: {
      procedimento_id: string;
      procedimento_nome: string;
      tuss: string;
      codigoservico: string;
      agendavel: boolean;
      agendamentoOnline: boolean;
      regiaoColeta: {
        codigo: string;
        descricao: string;
      }[];
    }[];
  }[];
}

interface MatrixProceduresParamsRequest {
  insuranceCode: string;
  insurancePlanCode: string;
  specialityCode: string;
}

interface MatrixProceduresPayloadRequest {
  convenio_id: string;
  plano_id: string;
  setor_id: string;
}

interface MatrixInsurancePlansParamsRequest {
  insuranceCode?: string;
}

interface MatrixProceduresResponse {
  procedimentos: {
    procedimento_id: string;
    procedimento_nome: string;
    setor_id: string;
    codigoservico: string;
    cobertura: 'RequerAutorizacao' | 'NaoCoberto' | string;
    ativo: boolean;
    autorizacao: string;
    regiaoColeta: {
      codigo: string;
      descricao: string;
    }[];
    unidades: {
      unidade_id: string;
      unidade_nome: string;
    }[];
    sexoRestrito: string[];
  }[];
}

interface MatrixProcedureDataRequest {
  convenio_id: string;
  plano_id: string;
  procedimentos: {
    procedimento_id: string;
    codigoRegiaoColeta: string;
  }[];
}

interface MatrixProcedureDataResponse {
  procedimentos: {
    procedimento_id: string;
    preco: string;
    autorizacao: string;
  }[];
  instrucao: {
    titulo: string;
    texto: string;
  };
}

export {
  MatrixProceduresParamsRequest,
  MatrixOrganizationUnitsResponse,
  MatrixInsurancesAndPlansResponse,
  MatrixDoctorResponse,
  MatrixInsurancesPlansResponse,
  MatrixSpecialitiesResponse,
  MatrixProceduresResponse,
  MatrixInsurancePlansParamsRequest,
  MatrixProceduresPayloadRequest,
  MatrixOrganizationUnitsParamsRequest,
  MatrixOrganizationUnitsPayloadRequest,
  MatrixDoctorParamsRequest,
  MatrixDoctorPayloadRequest,
  MatrixProcedureDataRequest,
  MatrixProcedureDataResponse,
};
