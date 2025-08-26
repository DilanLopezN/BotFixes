import { getAwaitingWorkingTime } from '../services/getAwaitingWorkingTime';
import { Team } from '../../team/interfaces/team.interface';

describe('getAwaitingWorkingTime - casos extras', () => {
    const createTeam = (attendancePeriods: any, offDays: any[] = []): Team =>
        ({
            name: 'Equipe X',
            roleUsers: [],
            priority: 1,
            attendancePeriods,
            offDays,
        } as any);

    it('horário integral dentro de expediente', async () => {
        const start = new Date('2025-08-04T09:00:00-03:00').getTime();
        const end = new Date('2025-08-04T12:00:00-03:00').getTime();
        const team = createTeam({
            mon: [{ start: 9 * 3600000, end: 17 * 3600000 }],
        });

        const result = await getAwaitingWorkingTime(start, end, team);
        expect(result).toBe(3 * 3600000);
    });

    it('dois períodos no mesmo dia', async () => {
        const start = new Date('2025-08-04T09:00:00-03:00').getTime();
        const end = new Date('2025-08-04T18:00:00-03:00').getTime();
        const team = createTeam({
            mon: [
                { start: 9 * 3600000, end: 12 * 3600000 },
                { start: 14 * 3600000, end: 18 * 3600000 },
            ],
        });

        const result = await getAwaitingWorkingTime(start, end, team);
        expect(result).toBe(7 * 3600000);
    });

    it('feriado parcial em meio período', async () => {
        const start = new Date('2025-08-04T09:00:00-03:00').getTime();
        const end = new Date('2025-08-04T14:00:00-03:00').getTime();
        const team = createTeam(
            {
                mon: [
                    { start: 9 * 3600000, end: 12 * 3600000 },
                    { start: 13 * 3600000, end: 17 * 3600000 },
                ],
            },
            [
                {
                    name: 'Reunião interna',
                    start: new Date('2025-08-04T13:00:00-03:00').getTime(),
                    end: new Date('2025-08-04T14:00:00-03:00').getTime(),
                },
            ],
        );

        const result = await getAwaitingWorkingTime(start, end, team);
        expect(result).toBe(3 * 3600000);
    });

    it('intervalo em dia sem expediente (quarta-feira)', async () => {
        const start = new Date('2025-08-06T09:00:00-03:00').getTime();
        const end = new Date('2025-08-06T17:00:00-03:00').getTime();
        const team = createTeam({ mon: [], wed: [] });

        const result = await getAwaitingWorkingTime(start, end, team);
        expect(result).toBe(0);
    });

    it('feriado integral interrompendo expediente', async () => {
        const start = new Date('2025-08-04T09:00:00-03:00').getTime();
        const end = new Date('2025-08-04T17:00:00-03:00').getTime();
        const team = createTeam({ mon: [{ start: 9 * 3600000, end: 17 * 3600000 }] }, [
            {
                name: 'Feriado',
                start: new Date('2025-08-04T00:00:00-03:00').getTime(),
                end: new Date('2025-08-04T23:59:59-03:00').getTime(),
            },
        ]);

        const result = await getAwaitingWorkingTime(start, end, team);
        expect(result).toBe(0);
    });

    it('intervalo atravessando dois dias úteis', async () => {
        const start = new Date('2025-08-04T15:00:00-03:00').getTime();
        const end = new Date('2025-08-05T11:00:00-03:00').getTime();
        const team = createTeam({
            mon: [{ start: 9 * 3600000, end: 17 * 3600000 }],
            tue: [{ start: 8 * 3600000, end: 12 * 3600000 }],
        });

        const result = await getAwaitingWorkingTime(start, end, team);
        expect(result).toBe(5 * 3600000);
    });

    it('intervalo fora de horário de expediente', async () => {
        const start = new Date('2025-08-04T02:00:00-03:00').getTime();
        const end = new Date('2025-08-04T06:00:00-03:00').getTime();
        const team = createTeam({
            mon: [{ start: 9 * 3600000, end: 17 * 3600000 }],
        });

        const result = await getAwaitingWorkingTime(start, end, team);
        expect(result).toBe(0);
    });

    it('feriados sobrepostos', async () => {
        const start = new Date('2025-08-04T09:00:00-03:00').getTime();
        const end = new Date('2025-08-04T18:00:00-03:00').getTime();
        const team = createTeam(
            {
                mon: [{ start: 9 * 3600000, end: 18 * 3600000 }],
            },
            [
                {
                    name: 'Feriado A',
                    start: new Date('2025-08-04T08:00:00-03:00').getTime(),
                    end: new Date('2025-08-04T12:00:00-03:00').getTime(),
                },
                {
                    name: 'Feriado B',
                    start: new Date('2025-08-04T11:30:00-03:00').getTime(),
                    end: new Date('2025-08-04T15:00:00-03:00').getTime(),
                },
            ],
        );

        const result = await getAwaitingWorkingTime(start, end, team);
        expect(Math.abs(result - 3 * 3600000)).toBeLessThanOrEqual(1);
    });

    it('expediente com horários fracionados', async () => {
        const start = new Date('2025-08-04T10:15:00-03:00').getTime();
        const end = new Date('2025-08-04T12:45:00-03:00').getTime();
        const team = createTeam({
            mon: [{ start: 10 * 3600000 + 15 * 60000, end: 12 * 3600000 + 45 * 60000 }],
        });

        const result = await getAwaitingWorkingTime(start, end, team);
        expect(result).toBe(2.5 * 3600000);
    });
});
