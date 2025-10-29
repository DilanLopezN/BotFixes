export class DateFormatUtil {
    static formatToISODate(birthDate: string): string {
        // Convert DD/MM/YYYY to YYYY-MM-DD
        if (birthDate.includes('/')) {
            const [day, month, year] = birthDate.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        // If already in YYYY-MM-DD format, return as is
        return birthDate;
    }

    static formatToDisplayDate(isoDate: string): string {
        // Convert YYYY-MM-DD to DD/MM/YYYY
        if (isoDate.includes('-') && isoDate.length === 10) {
            const [year, month, day] = isoDate.split('-');
            return `${day}/${month}/${year}`;
        }
        // If already in DD/MM/YYYY format, return as is
        return isoDate;
    }
}
