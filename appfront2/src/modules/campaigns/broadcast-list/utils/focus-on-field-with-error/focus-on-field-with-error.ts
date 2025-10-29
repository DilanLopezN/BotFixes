import { last } from 'lodash';

export const focusOnFieldWithError = () => {
  const duplicatedCellphoneElement = document.querySelectorAll('.cell-with-duplicated-phone');

  const lastElement = last(duplicatedCellphoneElement) as HTMLDivElement;

  if (lastElement) {
    lastElement.focus();
    return;
  }

  const requiredCell = document.querySelector('.cell-required.cell-is-empty') as HTMLDivElement;

  if (requiredCell) {
    requiredCell.focus();
  }
};
