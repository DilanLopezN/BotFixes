import { Team } from '../../team/interfaces/team.interface';
import * as moment from 'moment';

/**
 * Retorna o horário do dia (em milissegundos) a partir de um timestamp.
 * Exemplo: 08:30:00 => 8h * 3600000 + 30min * 60000 = 30600000 ms
 */
const timeOfDay = (date: number): number => {
    const m = moment(date);
    return m.hours() * 3600000 + m.minutes() * 60000 + m.seconds() * 1000;
};

/**
 * Verifica se o timestamp `date` está dentro de algum feriado ou pausa (offDay).
 */
const isWithinOffDay = (
    date: number,
    offDays: { start: number; end: number }[],
): { start: number; end: number } | undefined => {
    return offDays.find((offDay) => date >= offDay.start && date <= offDay.end);
};

/**
 * Calcula o tempo de sobreposição entre dois intervalos.
 * Retorna 0 se não houver interseção.
 */
const calculatePeriodOverlap = (start: number, end: number, periodStart: number, periodEnd: number): number => {
    const overlapStart = Math.max(start, periodStart);
    const overlapEnd = Math.min(end, periodEnd);
    return Math.max(0, overlapEnd - overlapStart);
};

/**
 * Função principal que calcula o tempo útil de espera (em milissegundos)
 * entre duas datas, considerando os horários de expediente da equipe e desconsiderando feriados.
 */
export const getAwaitingWorkingTime = async (startDate: number, endDate: number, team: Team): Promise<number> => {
    let waitingTime = 0;
    let currentDate = startDate;

    while (currentDate < endDate) {
        const currentMoment = moment(currentDate);
        const dayKey = currentMoment.locale('en').format('ddd').toLowerCase(); // ex: 'mon', 'tue'...
        const periods = team.attendancePeriods?.[dayKey] || [];

        // 👉 Se não há expediente no dia, pula pro próximo
        if (periods.length === 0) {
            currentDate = currentMoment.add(1, 'day').startOf('day').valueOf();
            continue;
        }

        // 👉 Verifica se o dia atual está dentro de algum offDay
        const offDaysToday = team.offDays.filter((offDay) =>
            currentMoment.isBetween(moment(offDay.start), moment(offDay.end), undefined, '[]'),
        );

        if (offDaysToday.length > 0) {
            const endOfOffDay = Math.max(...offDaysToday.map((o) => o.end));
            currentDate = moment(Math.min(endOfOffDay + 1, endDate)).valueOf();
            continue;
        }

        const currentTime = timeOfDay(currentDate);
        const isSameDay = currentMoment.isSame(moment(endDate), 'day');
        const endTime = isSameDay ? timeOfDay(endDate) : 86400000; // 24h em ms

        let moved = false;

        for (const period of periods) {
            const dayStart = currentMoment.clone().startOf('day').valueOf();
            const periodStart = dayStart + period.start;
            const periodEnd = dayStart + period.end;

            if (currentTime >= period.end || endTime <= period.start) continue;

            const from = Math.max(currentDate, periodStart);
            const to = Math.min(endDate, periodEnd);

            const offDuring = isWithinOffDay(from, team.offDays) || isWithinOffDay(to, team.offDays);
            if (!offDuring) {
                const overlap = calculatePeriodOverlap(from, to, periodStart, periodEnd);
                waitingTime += overlap;
                currentDate = to;
                moved = true;
                break;
            }
        }

        // Se não caiu em nenhum período válido, pula pro início do próximo dia
        if (!moved) {
            currentDate = currentMoment.add(1, 'day').startOf('day').valueOf();
        }
    }

    return waitingTime;
};
