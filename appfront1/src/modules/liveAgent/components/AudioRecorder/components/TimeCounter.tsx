import moment from 'moment';
import React, { useRef, useEffect } from 'react';

export const TimeCounter = () => {
  const elementDOMRef = useRef<any>(null);
  const intervalRef = useRef<any>();
  const startTimeRef = useRef<any>(null);

  useEffect(() => {
    startTimeRef.current = moment.utc();
    intervalRef.current = setInterval(() => {
      const now = moment.utc();
      const diff = now.diff(startTimeRef.current);

      elementDOMRef.current.innerHTML = moment.utc(diff).format('mm:ss');
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <span ref={elementDOMRef}>00:00</span>
  );
};
