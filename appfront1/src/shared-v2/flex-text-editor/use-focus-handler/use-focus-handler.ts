import { useState, useCallback } from 'react';
import { FocusHandlerReturnType } from './interfaces';

const useFocusHandler = (): FocusHandlerReturnType => {
    const [inputFocused, setInputFocused] = useState(false);
    const [editorFocused, setEditorFocused] = useState(false);

    const onEditorMouseDown = useCallback((): void => {
        setEditorFocused(true);
    }, []);

    const onInputMouseDown = useCallback((): void => {
        setInputFocused(true);
    }, []);

    const isEditorBlur = useCallback(
        (event: Event): boolean => {
            const target = event.target as HTMLElement;
            if ((target.tagName === 'INPUT' || target.tagName === 'LABEL') && !editorFocused) {
                setInputFocused(false);
                return true;
            } else if (target.tagName !== 'INPUT' && target.tagName !== 'LABEL' && !inputFocused) {
                setEditorFocused(false);
                return true;
            }
            return false;
        },
        [editorFocused, inputFocused]
    );

    const isEditorFocused = useCallback((): boolean => {
        if (!inputFocused) {
            return true;
        }
        setInputFocused(false);
        return false;
    }, [inputFocused]);

    const isToolbarFocused = useCallback((): boolean => {
        if (!editorFocused) {
            return true;
        }
        setEditorFocused(false);
        return false;
    }, [editorFocused]);

    const isInputFocused = useCallback((): boolean => inputFocused, [inputFocused]);

    return {
        onEditorMouseDown,
        onInputMouseDown,
        isEditorBlur,
        isEditorFocused,
        isToolbarFocused,
        isInputFocused,
    };
};

export { useFocusHandler };
