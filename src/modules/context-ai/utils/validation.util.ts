export class ValidationUtil {
    static isValidCpfFormat(cpf: string): boolean {
        if (!cpf || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
            return false;
        }

        // Validate first check digit
        let sum = 0;
        for (let i = 1; i <= 9; i++) {
            sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        }

        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.substring(9, 10))) return false;

        // Validate second check digit
        sum = 0;
        for (let i = 1; i <= 10; i++) {
            sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        }

        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.substring(10, 11))) return false;

        return true;
    }

    static isValidDate(day: number, month: number, year: number): boolean {
        if (day < 1 || day > 31 || month < 1 || month > 12) {
            return false;
        }

        if (year < 1900 || year > 2010) {
            return false;
        }

        // Days per month
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        // Check for leap year in February
        if (month === 2 && this.isLeapYear(year)) {
            return day <= 29;
        }

        return day <= daysInMonth[month - 1];
    }

    static isLeapYear(year: number): boolean {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }
}
