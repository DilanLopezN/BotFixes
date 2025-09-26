export const sumTime = (time: string) => {
    let [hours, minutes, seconds] = time.split(':').map((part) => parseInt(part, 10));
    return hours * 3600 + minutes * 60 + seconds;
};
