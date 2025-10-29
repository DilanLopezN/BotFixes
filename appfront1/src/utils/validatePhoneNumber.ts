import { PhoneNumberUtil } from 'google-libphonenumber';

interface IValidatePhoneNumber {
    inputNumber: string;
    country: any;
    countries: any[];
    setValidPhoneNumber: (value: boolean) => void;
    setPhonePersonalized: (value: boolean) => void;
    phonePersonalized: boolean;
}

export const validatePhoneNumber = ({
    country,
    inputNumber,
    setPhonePersonalized,
    setValidPhoneNumber,
    phonePersonalized,
}: IValidatePhoneNumber): boolean => {
    try {
        const countryCode: string = country.iso2;
        const phoneUtil = PhoneNumberUtil.getInstance();
        const rawNumber = `+${inputNumber}`;
        const number = phoneUtil.parse(rawNumber, countryCode);
        const isValid = phoneUtil.isValidNumber(number);
        const localCountryCode: string = 'br';

        if (countryCode === 'ar') {
            if (inputNumber.length === 13) {
                setValidPhoneNumber(true);
                return true;
            }
            setValidPhoneNumber(false);
            return false;
        }

        if (countryCode === 'py') {
            if (inputNumber.length === 12) {
                setValidPhoneNumber(true);
                return true;
            }
            setValidPhoneNumber(false);
            return false;
        }

        if (countryCode !== localCountryCode) {
            setValidPhoneNumber(true);
            setPhonePersonalized(false);
            return true;
        }

        if (inputNumber.startsWith('5508')) {
            setPhonePersonalized(true);
        } else {
            setPhonePersonalized(false);
        }

        if (country.dialCode === '55' && !phonePersonalized) {
            if (inputNumber[4] === '9') {
                if (inputNumber.length === country.format.replace(/[^/.]/g, '').length) {
                    setValidPhoneNumber(true);
                    return true;
                }
            } else if (inputNumber.length === country.format.replace(/[^/.]/g, '').length - 1) {
                setValidPhoneNumber(true);
                return true;
            }
        }

        if (phonePersonalized) {
            if (country.dialCode === '55' && inputNumber.startsWith('0800', 2) && inputNumber.length - 2 === 11) {
                setValidPhoneNumber(true);
                return true;
            }

            return false;
        }

        setValidPhoneNumber(isValid);
        return isValid;
    } catch (err) {
        setValidPhoneNumber(false);
        return false;
    }
};
