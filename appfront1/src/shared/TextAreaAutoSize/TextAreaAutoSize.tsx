import React, { FC, useEffect, useRef } from 'react'
import { timeout } from '../../utils/Timer';
import { TextAreaSimple } from '../TextAreaSimple/TextAreaSimple';

const TextAreaAutoSize: FC<any> = ({
    ...props
}) => {

    const textareaRef: any = useRef();

    useEffect(() => {
        textareaRef.current?.addEventListener('keydown', autosize);

        return () => {
            textareaRef.current?.removeEventListener('keydown', autosize);
        }
    }, [])

    const autosize = () => {
        timeout(() => {
            if (!textareaRef || !textareaRef.current) return;

            textareaRef.current.style.cssText = 'height:auto;';
            textareaRef.current.style.cssText = 'height:' + textareaRef.current.scrollHeight + 'px';
        }, 0);
    }

    return (
        <TextAreaSimple
            ref={ref => textareaRef.current = ref}
            {...props}
        />
    )
}

export default TextAreaAutoSize
