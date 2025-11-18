interface AppointmentResponse {
  availabilities: Appointment[];
  unavailabilities: Appointment[];
}

interface Appointment {
  machid: string;
  activityPrice: string;
  resourceName: string;
  resourceid: string;
  duration: string;
  startTime: string;
  endTime: string;
  activityid: string;
  areaid: string;
  start_datetime_timestamp: number;
  provider_session_id?: string;
  notice?: string;
}

interface DoctoraliaCreateAppointmentRequest {
  userid: string;
  resourceid: string;
  start_date: string;
  end_date: string;
  startTime: string;
  endTime: string;
  activityid: string;
  insuranceid: string;
  areaid: string;
  provider_session_id?: string;
  insurance_card_number?: string;
  custom_0?: number | string;
}

interface DoctoraliaUpdateAppointmentRequest {
  is_pending?: number;
  userid?: string;
  resourceid?: string;
  start_date?: string;
  end_date?: string;
  startTime?: string;
  endTime?: string;
  activityid?: string;
  insuranceid?: string;
  areaid?: string;
  provider_session_id?: string;
  insurance_card_number?: string;
}

interface DoctoraliaConfirmedAppointmentResponse {
  resid: string;
  start_date: string;
  startTime: string;
  activityTitle: string;
  typologyid: string;
  reservation_duration: string;
  resource_activity_price: string;
  typologyTitle: string;
  areaTitle: string;
  resourceid: string;
  insuranceid: string;
  areaid: string;
  activityid: string;
  insuranceTitle?: string;
  resourceName: string;
  activityPrice: string;
  cancelled: string;
  typology_lid?: string;
  start_datetime_timestamp: number;
  status_code: string;
}

interface DoctoraliaAvailableSchedules {
  insuranceid: string;
  typologyid: string;
  activityid: string;
  areaid: string | string[];
  minTime: string;
  maxTime: string;
  start_date: string;
  end_date: string;
  numDays?: number;
  resourceid?: string;
  resourceids?: string[];
  resource_consumerid?: string;
}

export {
  AppointmentResponse,
  Appointment,
  DoctoraliaUpdateAppointmentRequest,
  DoctoraliaConfirmedAppointmentResponse,
  DoctoraliaAvailableSchedules,
  DoctoraliaCreateAppointmentRequest,
};
