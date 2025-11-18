import { Chance } from 'chance';
import { RawAppointment } from '../health/shared/appointment.service';

const getSampleAppointment = (appointment?: Partial<RawAppointment>): RawAppointment => {
  const chance = new Chance();

  return {
    actions: [],
    appointmentCode: String(chance.d100() * 10),
    appointmentDate: null,
    ...appointment,
  } as RawAppointment;
};

export { getSampleAppointment };
