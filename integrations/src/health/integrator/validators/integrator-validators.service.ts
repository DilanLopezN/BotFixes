import { HttpStatus, Injectable } from '@nestjs/common';
import {
  CancelScheduleV2,
  ConfirmScheduleV2,
  ConfirmationScheduleGuidance,
  MatchFlowsConfirmation,
  ValidateScheduleConfirmation,
} from '../interfaces';
import { HTTP_ERROR_THROWER } from '../../../common/exceptions.service';

@Injectable()
export class IntegratorValidatorsService {
  public validateGetConfirmationScheduleGuidance(data: ConfirmationScheduleGuidance) {
    if (!data.scheduleCodes?.length && !data.scheduleIds?.length) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, {
        message:
          'Parâmetros inválidos. É necessário informar scheduleCodes ou scheduleIds. validateGetConfirmationScheduleGuidance' +
          JSON.stringify(data),
      });
    }
  }

  public validateConfirmScheduleV2(data: ConfirmScheduleV2) {
    if (!data.scheduleCode && !data.scheduleId) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, {
        message:
          'Parâmetros inválidos. É necessário informar scheduleCode ou scheduleId. validateConfirmScheduleV2' +
          JSON.stringify(data),
      });
    }
  }

  public validateCancelScheduleV2(data: CancelScheduleV2) {
    if (!data.scheduleCode && !data.scheduleId) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, {
        message:
          'Parâmetros inválidos. É necessário informar scheduleCode ou scheduleId. validateCancelScheduleV2' +
          JSON.stringify(data),
      });
    }
  }

  public validateMatchFlowsConfirmation(data: MatchFlowsConfirmation) {
    if (!data.scheduleCode && !data.scheduleId && !data?.scheduleIds?.length) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, {
        message:
          'Parâmetros inválidos. É necessário informar scheduleCode ou scheduleId. validateMatchFlowsConfirmation' +
          JSON.stringify(data),
      });
    }
  }

  public validateValidateScheduleData(data: ValidateScheduleConfirmation) {
    if (!data.scheduleCode && !data.scheduleId) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, {
        message:
          'Parâmetros inválidos. É necessário informar scheduleCode ou scheduleId. validateValidateScheduleData' +
          JSON.stringify(data),
      });
    }
  }
}
