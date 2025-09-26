export const secondsToHms = (tempo) => {
    let remainingSeconds = Math.round(tempo);
    let hours = Math.floor(remainingSeconds / 3600);
    remainingSeconds %= 3600;

    let minutes = Math.floor(remainingSeconds / 60);
    let seconds = remainingSeconds % 60;

    const padWithZero = (value, isMinutes = false) => {
        if (isMinutes && value < 10) {
            return `${value}`;
        }
        return value < 10 ? `0${value}` : value;
    };

    let formattedTime = '';

    if (hours > 0) {
        formattedTime += `${padWithZero(hours)}h `;
    }

    formattedTime += `${padWithZero(minutes, true)}:${padWithZero(seconds)}`;

    return formattedTime;
};
