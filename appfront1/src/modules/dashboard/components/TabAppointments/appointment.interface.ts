enum AppointmentStatus {
    error = -1,
    inProgress = 0,
    scheduled = 1,
    withoutSchedules = 2,
    withoutEntities = 3,
    redirected = 4,
}

enum AppointmentConfirmed {
    inProgress = -1,
    notConfirmed = 0,
    confirmed = 1,
}

enum AppointmentPeriod {
    morning = 0,
    afternoon = 1,
    indifferent = 2,
}

export { AppointmentConfirmed, AppointmentStatus, AppointmentPeriod };
