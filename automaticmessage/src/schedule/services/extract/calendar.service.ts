import { Injectable } from '@nestjs/common';
import * as moment from 'dayjs';

@Injectable()
export class CalendarService {
  constructor() {}

  async getHolidays(): Promise<Array<any>> {
    const holiday2023 = [
      {
        date: '2023-01-01',
        name: 'Confraternização mundial',
        type: 'national',
      },
      { date: '2023-02-21', name: 'Carnaval', type: 'national' },
      { date: '2023-04-07', name: 'Sexta-feira Santa', type: 'national' },
      { date: '2023-04-09', name: 'Páscoa', type: 'national' },
      { date: '2023-04-21', name: 'Tiradentes', type: 'national' },
      { date: '2023-05-01', name: 'Dia do trabalho', type: 'national' },
      { date: '2023-06-08', name: 'Corpus Christi', type: 'national' },
      { date: '2023-09-07', name: 'Independência do Brasil', type: 'national' },
      { date: '2023-10-12', name: 'Nossa Senhora Aparecida', type: 'national' },
      { date: '2023-11-02', name: 'Finados', type: 'national' },
      {
        date: '2023-11-15',
        name: 'Proclamação da República',
        type: 'national',
      },
      { date: '2023-12-25', name: 'Natal', type: 'national' },
    ];
    const holiday2024 = [
      {
        date: '2024-01-01',
        name: 'Confraternização mundial',
        type: 'national',
      },
      { date: '2024-02-13', name: 'Carnaval', type: 'national' },
      { date: '2024-03-29', name: 'Sexta-feira Santa', type: 'national' },
      { date: '2024-03-31', name: 'Páscoa', type: 'national' },
      { date: '2024-04-21', name: 'Tiradentes', type: 'national' },
      { date: '2024-05-01', name: 'Dia do trabalho', type: 'national' },
      { date: '2024-05-30', name: 'Corpus Christi', type: 'national' },
      { date: '2024-09-07', name: 'Independência do Brasil', type: 'national' },
      { date: '2024-10-12', name: 'Nossa Senhora Aparecida', type: 'national' },
      { date: '2024-11-02', name: 'Finados', type: 'national' },
      {
        date: '2024-11-15',
        name: 'Proclamação da República',
        type: 'national',
      },
      { date: '2024-12-25', name: 'Natal', type: 'national' },
    ];
    const holiday2025 = [
      {
        date: '2025-01-01',
        name: 'Confraternização mundial',
        type: 'national',
      },
      { date: '2025-03-04', name: 'Carnaval', type: 'national' },
      { date: '2025-04-18', name: 'Sexta-feira Santa', type: 'national' },
      { date: '2025-04-20', name: 'Páscoa', type: 'national' },
      { date: '2025-04-21', name: 'Tiradentes', type: 'national' },
      { date: '2025-05-01', name: 'Dia do trabalho', type: 'national' },
      { date: '2025-06-19', name: 'Corpus Christi', type: 'national' },
      { date: '2025-09-07', name: 'Independência do Brasil', type: 'national' },
      { date: '2025-10-12', name: 'Nossa Senhora Aparecida', type: 'national' },
      { date: '2025-11-02', name: 'Finados', type: 'national' },
      {
        date: '2025-11-15',
        name: 'Proclamação da República',
        type: 'national',
      },
      { date: '2025-12-25', name: 'Natal', type: 'national' },
    ];
    const holiday2026 = [
      {
        date: '2026-01-01',
        name: 'Confraternização mundial',
        type: 'national',
      },
      { date: '2026-02-17', name: 'Carnaval', type: 'national' },
      { date: '2026-04-03', name: 'Sexta-feira Santa', type: 'national' },
      { date: '2026-04-05', name: 'Páscoa', type: 'national' },
      { date: '2026-04-21', name: 'Tiradentes', type: 'national' },
      { date: '2026-05-01', name: 'Dia do trabalho', type: 'national' },
      { date: '2026-06-04', name: 'Corpus Christi', type: 'national' },
      { date: '2026-09-07', name: 'Independência do Brasil', type: 'national' },
      { date: '2026-10-12', name: 'Nossa Senhora Aparecida', type: 'national' },
      { date: '2026-11-02', name: 'Finados', type: 'national' },
      {
        date: '2026-11-15',
        name: 'Proclamação da República',
        type: 'national',
      },
      { date: '2026-12-25', name: 'Natal', type: 'national' },
    ];
    return [...holiday2023, ...holiday2024, ...holiday2025, ...holiday2026];
  }

  async checkIsHolidayOrWeekend(day: moment.Dayjs) {
    if (day.day() == 6 || day.day() == 0) {
      return true;
    }
    const holidays = await this.getHolidays();
    return !!holidays.find(
      (holiday) => holiday.date == day.format('YYYY-MM-DD'),
    );
  }

  async getNextHolidayOrWeekendRange(day: moment.Dayjs) {
    let isHolidayOrWeekend = await this.checkIsHolidayOrWeekend(day);
    let nextDay = moment(day);
    let count = 0;
    while (isHolidayOrWeekend) {
      nextDay = moment(nextDay).add(1, 'day');
      isHolidayOrWeekend = await this.checkIsHolidayOrWeekend(nextDay);
      count++;
      if (!isHolidayOrWeekend || count > 50) {
        break;
      }
    }

    return { startDate: day.startOf('day'), endDate: nextDay.endOf('day') };
  }

  async getDefaultCalendarRanges(dayString: string): Promise<any> {
    const now = moment(dayString);
    const hoursBeforeScheduleDate = 24;
    let startDate = now.clone().add(1, 'day').startOf('day');
    let endDate = now.clone().add(1, 'day').endOf('day');

    if (!hoursBeforeScheduleDate || hoursBeforeScheduleDate <= 24) {
      const result = await this.getNextHolidayOrWeekendRange(startDate);
      startDate = result.startDate;
      endDate = result.endDate;
    } else if (hoursBeforeScheduleDate) {
      startDate = now
        .clone()
        .add(hoursBeforeScheduleDate, 'hour')
        .startOf('day');
      endDate = now.clone().add(hoursBeforeScheduleDate, 'hour').endOf('day');
    }

    console.log(startDate.format());
    console.log(endDate.format());
  }
}
