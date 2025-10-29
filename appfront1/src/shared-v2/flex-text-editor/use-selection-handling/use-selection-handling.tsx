import { DraftHandleValue, EditorState, Modifier, RichUtils, SelectionState } from 'draft-js';
import { Dispatch, SetStateAction } from 'react';
import { FlexTextType } from '../enum/flex-text-type.enum';
import { IPartDefault } from '../enum/i-part-default.enum';

const useSelectionHandling = (
    editorState: EditorState,
    setEditorState: Dispatch<SetStateAction<EditorState>>,
    maxLength: number,
    typeBlock: FlexTextType
) => {
    const styleCommands: { [key: string]: string } = {
        bold: 'BOLD',
        italic: 'ITALIC',
        underline: 'UNDERLINE',
        strikethrough: 'STRIKETHROUGH',
        code: 'CODE',
    };

    const parameter = typeBlock === FlexTextType.TEMPLATE ? IPartDefault.variavel : IPartDefault.parameter;


    const handleKeyCommand = (command: string, editorState: EditorState, eventTimeStamp?: number): DraftHandleValue => {
        const selection = editorState.getSelection();
        const contentState = editorState.getCurrentContent();
        const startKey = selection.getStartKey();
        const startOffset = selection.getStartOffset();
        const blockWithVariable = contentState.getBlockForKey(startKey);
        const text = blockWithVariable.getText();
        const variableRegex = /\{\{.*?\}\}/g;
        let match;

        while ((match = variableRegex.exec(text)) !== null) {
            const variableStart = match.index;
            const variableEnd = match.index + match[0].length;

            if (startOffset > variableStart && startOffset <= variableEnd) {
                if (command === 'backspace' || command === 'delete') {
                    const targetRange = new SelectionState({
                        anchorKey: startKey,
                        anchorOffset: variableStart,
                        focusKey: startKey,
                        focusOffset: variableEnd,
                    });

                    const newContentState = Modifier.removeRange(contentState, targetRange, 'backward');
                    const newEditorState = EditorState.push(editorState, newContentState, 'remove-range');

                    setEditorState(newEditorState);
                    return 'handled';
                }
            }
        }

        const styleCommand = styleCommands[command];
        if (styleCommand && typeBlock === FlexTextType.TEMPLATE) {
            setEditorState(RichUtils.toggleInlineStyle(editorState, styleCommand));
            return 'handled';
        }

        return 'not-handled';
    };

    const handleBeforeInput = (chars: string, editorState: EditorState) => {
        const selection = editorState.getSelection();
        const contentState = editorState.getCurrentContent();
        const startKey = selection.getStartKey();
        const startOffset = selection.getStartOffset();
        const blockWithVariable = contentState.getBlockForKey(startKey);
        const text = blockWithVariable.getText();
        const variableRegex = /\{\{.*?\}\}/g;
        let match;

        while ((match = variableRegex.exec(text)) !== null) {
            const variableStart = match.index;
            const variableEnd = match.index + match[0].length;

            if (startOffset > variableStart && startOffset <= variableEnd) {
                const targetRange = new SelectionState({
                    anchorKey: startKey,
                    anchorOffset: variableEnd,
                    focusKey: startKey,
                    focusOffset: variableEnd,
                });

                const newContentState = Modifier.insertText(contentState, targetRange, chars);
                const newEditorState = EditorState.push(editorState, newContentState, 'insert-characters');

                const newSelection = newEditorState.getSelection().merge({
                    anchorOffset: variableEnd + 1,
                    focusOffset: variableEnd + 1,
                });
                const finalEditorState = EditorState.forceSelection(newEditorState, newSelection);

                setEditorState(finalEditorState);
                return 'handled';
            }
        }
        const content = editorState.getCurrentContent();
        const plainText = content.getPlainText();
        const totalLength = plainText.length + chars.length;

        if (chars === '{') {
            const anchorOffset = selection.getAnchorOffset();
            const blockKey = selection.getStartKey();
            const block = contentState.getBlockForKey(blockKey);
            const textBeforeCursor = block.getText().slice(0, anchorOffset);

            if (textBeforeCursor.endsWith('{')) {
                const newState = EditorState.push(
                    editorState,
                    Modifier.insertText(contentState, selection, `{${parameter}}}`),
                    'insert-characters'
                );
                setEditorState(newState);

                const newSelection = selection.merge({
                    anchorOffset: anchorOffset + 12,
                    focusOffset: anchorOffset + 12,
                });
                const newStateWithSelection = EditorState.forceSelection(newState, newSelection);
                setEditorState(newStateWithSelection);

                return 'handled';
            }
        }

        return totalLength > maxLength ? 'handled' : 'not-handled';
    };

    return {
        handleKeyCommand,
        handleBeforeInput,
    };
};

export { useSelectionHandling };
