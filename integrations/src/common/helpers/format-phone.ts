export const formatPhone = (phone: string, removeDDI?: boolean): string => {
  if (!phone) {
    return phone;
  }

  phone = phone.match(/\d+/g)?.join('');

  if (
    removeDDI &&
    // valida tamanho para não retirar o 55 se for o DDD
    (phone.length === 12 || phone.length === 13) &&
    (phone.startsWith('55') || phone.startsWith('+55'))
  ) {
    phone = phone.replace(/^\+55/, '');
    phone = phone.replace(/^55/, '');
    return phone;
  }

  return phone;
};

export const convertPhoneNumber = (phone: string): string => {
  phone = phone.replace(/\D/g, '');

  if (phone.length === 13 || !phone) {
    return phone;
  }

  if (!phone.startsWith('55') && phone.length >= 10) {
    phone = `55${phone}`;
  }

  if (phone.length === 12) {
    if (Number(phone.slice(4, 5)) <= 7) {
      return phone;
    } else {
      return phone
        .split('')
        .map((k, i) => (i === 4 ? `9${k}` : k))
        .join('');
    }
  }

  return phone;
};

export const getNumberWithout9 = (number: string): string => {
  if (number.length == 13 && number.startsWith('55')) {
    const firstPart = number.slice(0, 4);
    const secondPart = number.slice(5);
    return firstPart + secondPart;
  }
  return number;
};

export const getNumberWith9 = (number: string): string => {
  if (number.length == 12 && number.startsWith('55')) {
    return number.slice(0, 4) + '9' + number.slice(-8);
  }
  if (number.length == 8 && Number(number?.slice(0, 1)) > 6) {
    return '9' + number;
  }
  return number;
};

export const formatPhoneWithDDI = (ddi: string, ddd: string, phone: string): string => {
  if (!phone) {
    return '';
  }

  let parsedPhoneNumber = '';

  if (ddd) {
    parsedPhoneNumber = `${ddd}${phone}`;
  }

  if (ddi) {
    parsedPhoneNumber = `${ddi}${parsedPhoneNumber}`;
  } else {
    parsedPhoneNumber = `55${parsedPhoneNumber}`;
  }

  return parsedPhoneNumber;
};
