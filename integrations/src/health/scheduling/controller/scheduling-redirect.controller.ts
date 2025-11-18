import { Controller, Get, Param, Query } from '@nestjs/common';
import { SchedulingService } from '../services/scheduling.service';
import { decodeToken } from 'common/helpers/decode-token';
import { ConfirmationScheduleDataEmail } from '../interfaces/confirmation-schedule-data-email.interface';

@Controller({
  path: 'b',
})
export class SchedulingRedirectController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get(':shortId')
  async redirect(
    @Param('shortId') shortId: string,
    @Query('cfToken') confimationToken?: string,
  ): Promise<{ path: string }> {
    const redirectUrl = process.env.SCHEDULING_APP_URL;
    const cfTokenKey = process.env.CF_TOKEN_KEY;

    let data: ConfirmationScheduleDataEmail;

    try {
      if (confimationToken) {
        data = decodeToken<ConfirmationScheduleDataEmail>(confimationToken, cfTokenKey);
      }
    } catch (error) {
      console.error(error);
    }

    try {
      const { token, link: path } = await this.schedulingService.getAccessTokenAndRedirect(shortId, data);
      const separator = path.includes('?') ? '&' : '?';
      return { path: `${redirectUrl}/${path}${separator}token=${token}` };
    } catch (error) {
      console.log(error);
      return { path: `${redirectUrl}/resume/error` };
    }
  }
}
