import { Team } from '../../team/interfaces/team.interface';
import * as moment from 'moment';

export const getAwaitingWorkingTime = async (startDate: number, endDate: number, team: Team) => {
    let count = 1;
    let waitingTime = 0;
    let newStartDate = startDate;

    const timeofDay = (date) => {
        const hour = moment(date).format('HH:mm:ss').split(':');
        const timestamp = Number(hour[0]) * 3600000 + Number(hour[1]) * 60000 + Number(hour[2]) * 1000;

        return timestamp;
    };
    const hourEndDate = timeofDay(endDate);

    while (newStartDate < endDate) {
        let day = moment(newStartDate).format('ddd').toLocaleLowerCase();

        if (team.attendancePeriods[day].length === 0) {
            const dayTime = moment(newStartDate).add(1, 'day').startOf('day').valueOf();
            newStartDate = dayTime;
        } else {
            let time = 0;
            let hourStartDate = timeofDay(newStartDate);

            const offDaysPeriod =
                team?.offDays.filter(
                    (offDay) => moment(newStartDate).format(`DD/MM/YYYY`) === moment(offDay.start).format(`DD/MM/YYYY`),
                ) || [];

            //verifica se existe feriados no periodo
            if (offDaysPeriod.length) {
                const containsOffDays = offDaysPeriod.find(
                    (offDay) => moment(newStartDate).format(`DD/MM/YYYY`) === moment(offDay.start).format(`DD/MM/YYYY`),
                );

                if (containsOffDays) {
                    const hourStartOffDay = timeofDay(containsOffDays.start);
                    const hourEndOffDay = timeofDay(containsOffDays.end);

                    // Verifica se o offDay começou fora dos periodos de atendimento
                    if (
                        (hourStartOffDay <= team.attendancePeriods[day][0].start &&
                            hourEndOffDay >= team.attendancePeriods[day][0].end) ||
                        (hourStartOffDay >= team.attendancePeriods[day][0].end &&
                            hourStartOffDay <= team.attendancePeriods[day][1].start) ||
                        (hourStartOffDay < team.attendancePeriods[day][0].start &&
                            hourEndOffDay <= team.attendancePeriods[day][0].start) ||
                        (team.attendancePeriods[day][1] &&
                            ((hourStartOffDay <= team.attendancePeriods[day][1].start &&
                                hourEndOffDay >= team.attendancePeriods[day][1].end) ||
                                hourStartOffDay >= team.attendancePeriods[day][1].end ||
                                (hourStartOffDay < team.attendancePeriods[day][1].start &&
                                    hourEndOffDay <= team.attendancePeriods[day][1].start)))
                    ) {
                        if (endDate >= containsOffDays.end) {
                            newStartDate = containsOffDays.end;
                        } else {
                            newStartDate = endDate;
                            break;
                        }
                    } else {
                        team.attendancePeriods[day].forEach((period) => {
                            hourStartDate = timeofDay(newStartDate);
                            if (
                                hourStartDate >= period.end ||
                                (hourStartDate < period.start && hourEndDate <= period.start) ||
                                newStartDate >= endDate
                            ) {
                                return;
                            }

                            // const endDateCompare = moment(endDate).format(`DD/MM/YYYY`);
                            // const newStartDateCompare = moment(newStartDate).format(`DD/MM/YYYY`);
                            

                            if (
                                moment(moment(endDate).format(`DD/MM/YYYY`)).isSame(
                                    moment(newStartDate).format(`DD/MM/YYYY`),
                                )
                            ) {
                                if (count === 1) {
                                    if (period.start >= hourStartDate) {
                                        if (hourEndDate > period.end) {
                                            if (period.end < hourStartOffDay) {
                                                time += period.end - period.start;
                                            } else {
                                                time += hourStartOffDay - period.start;
                                                newStartDate = containsOffDays.end;
                                            }
                                        } else {
                                            if (hourEndDate < hourStartOffDay) {
                                                time += hourEndDate - period.start;
                                            } else {
                                                time += hourStartOffDay - period.start;
                                                newStartDate = containsOffDays.end;
                                            }
                                        }
                                    } else {
                                        if (hourEndDate > period.end) {
                                            if (hourEndDate < hourStartOffDay) {
                                                time += period.end - hourStartDate;
                                            } else {
                                                time += hourStartOffDay - hourStartDate;
                                                newStartDate = containsOffDays.end;
                                            }
                                        } else {
                                            if (hourEndDate < hourStartOffDay) {
                                                time += hourEndDate - hourStartDate;
                                                newStartDate = containsOffDays.end;
                                            } else {
                                                time += hourStartOffDay - hourStartDate;
                                                newStartDate = containsOffDays.end;
                                            }
                                        }
                                    }
                                } else {
                                    if (hourEndDate > period.end) {
                                        if (period.end < hourStartOffDay) {
                                            time += period.end - period.start;
                                        } else {
                                            time += hourStartOffDay - period.start;
                                            newStartDate = containsOffDays.end;
                                        }
                                    } else {
                                        if (period.end < hourStartOffDay) {
                                            time += hourEndDate - period.start;
                                        } else {
                                            time += hourStartOffDay - period.start;
                                            newStartDate = containsOffDays.end;
                                        }
                                    }
                                }
                            } else {
                                if (hourStartDate > period.start) {
                                    if (period.end < hourStartOffDay) {
                                        time += period.end - hourStartDate;
                                    } else {
                                        time += hourStartOffDay - hourStartDate;
                                        newStartDate = containsOffDays.end;
                                    }
                                } else {
                                    if (period.end < hourStartOffDay) {
                                        time += period.end - period.start;
                                    } else {
                                        time += hourStartOffDay - period.start;
                                        newStartDate = containsOffDays.end;
                                    }
                                }
                            }
                        });
                    }
                    day = moment(newStartDate).format('ddd').toLocaleLowerCase();
                }
            }
            hourStartDate = timeofDay(newStartDate);
            const equalsDate = moment(endDate).format(`DD/MM/YYYY`) === moment(newStartDate).format(`DD/MM/YYYY`);

            team.attendancePeriods[day].forEach((period) => {
                if (
                    hourStartDate >= period.end ||
                    (equalsDate && hourStartDate < period.start && hourEndDate <= period.start) ||
                    newStartDate >= endDate
                )
                    return;

                if (equalsDate) {
                    if (count === 1) {
                        if (period.start >= hourStartDate) {
                            if (hourEndDate > period.end) {
                                time += period.end - period.start;
                            } else {
                                time += hourEndDate - period.start;
                            }
                        } else {
                            if (hourEndDate > period.end) {
                                time += period.end - hourStartDate;
                            } else {
                                time += hourEndDate - hourStartDate;
                            }
                        }
                    } else {
                        if (hourEndDate > period.end) {
                            time += period.end - period.start;
                        } else {
                            time += hourEndDate - period.start;
                        }
                    }
                } else {
                    if (hourStartDate >= period.start) {
                        time += period.end - hourStartDate;
                    } else {
                        time += period.end - period.start;
                    }
                }
            });

            waitingTime += time;
            newStartDate = moment(newStartDate).add(1, 'day').startOf('day').valueOf();
        }
        count += 1;
    }

    return waitingTime;
};
