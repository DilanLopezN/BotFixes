import { type FormProps } from 'antd';

export const scrollToInputWithError: FormProps['onFinishFailed'] = (errorInfo) => {
  if (errorInfo.errorFields.length > 0) {
    const errorElements = document.getElementsByClassName('ant-input-status-error');

    let firstErrorElement: HTMLElement | null = null;

    if (errorElements.length > 0) {
      firstErrorElement = errorElements[0].querySelector('input, textarea, select') as HTMLElement;
    } else {
      const pickerElements = document.getElementsByClassName(
        'ant-picker ant-picker-outlined ant-picker-status-error'
      );
      if (pickerElements.length > 0) {
        firstErrorElement = pickerElements[0].querySelector(
          'input, textarea, select'
        ) as HTMLElement;
      }
    }
    if (firstErrorElement) {
      firstErrorElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }
};
