import React, { useRef, useEffect } from "react";

export interface ClickOutsideProps {
    onClickOutside: (event?: any) => void;
    children: any;
    className?: string;
    style?: any;
}

function useOutsideAlerter(ref, onClick) {
  useEffect(() => {

    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onClick(event)
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);
}

export default function ClickOutside(props: ClickOutsideProps) {
  const wrapperRef = useRef(null);
  useOutsideAlerter(wrapperRef, props.onClickOutside);

  return <div className={props.className} style={props.style} ref={wrapperRef}>{props.children}</div>;
}