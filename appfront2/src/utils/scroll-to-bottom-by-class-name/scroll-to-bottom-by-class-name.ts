export const scrollToBottomByClassName = (className: string) => {
  const ref = document.querySelector(className);

  if (ref) {
    ref.scrollTo({
      top: ref.scrollHeight + 50,
      behavior: 'smooth',
    });
  }
};
