export type FocusHandlerReturnType = {
    onEditorMouseDown: () => void;
    onInputMouseDown: () => void;
    isEditorBlur: (event: Event) => boolean;
    isEditorFocused: () => boolean;
    isToolbarFocused: () => boolean;
    isInputFocused: () => boolean;
};
