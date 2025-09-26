import { DraftHandleValue, Editor, EditorState, Modifier } from 'draft-js';
import { IPart } from 'kissbot-core';
import React, { forwardRef, useEffect } from 'react';
import { DraftType } from './enum/draft-type.enum';
import { FlexTextEditorProps } from './interfaces';
import { EditorContent } from './styles';
import { useEditorState } from './use-editor-state';
import { useSelectionHandling } from './use-selection-handling';

const FlexTextEditor: React.ForwardRefRenderFunction<Editor, FlexTextEditorProps> = (
    { initialText, maxLength, disabled, onEntityChange, typeBlock, userSaysParts, onFocus, initialContent },
    ref
) => {
    const onChangeVariableBlock = (iPart: IPart, start: number, end: number) => {
        convertValueBlock(iPart, start, end);
    };
    const { editorState, setEditorState, isOpenEditVariable, onChange, editor, handleTextChange, handleReturn } =
        useEditorState(initialText, maxLength, onEntityChange, typeBlock, userSaysParts ?? [], onChangeVariableBlock);

    const { handleBeforeInput, handleKeyCommand } = useSelectionHandling(
        editorState,
        setEditorState,
        maxLength,
        typeBlock
    );

    const convertValueBlock = (iPart: IPart, start: number, end: number) => {
        if (editor.current) {
            const content = editor.current.props.editorState.getCurrentContent();
            const selection = editor.current.props.editorState.getSelection();
            const mentionTextSelection = selection.merge({
                anchorOffset: start,
                focusOffset: end,
            });
            const contentStateWithEntity = content.createEntity('VARIABLE', 'IMMUTABLE', iPart);
            const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

            const blockKey = selection.getStartKey();
            const currentInlineStyle = content.getBlockForKey(blockKey).getInlineStyleAt(start);
            const textWithEntity = Modifier.replaceText(
                contentStateWithEntity,
                mentionTextSelection,
                `{{${iPart.value}}}`,
                currentInlineStyle,
                entityKey
            );
            const newState = EditorState.push(editor.current.props.editorState, textWithEntity, 'insert-characters');
            onChange(EditorState.forceSelection(newState, textWithEntity.getSelectionAfter()));
        }
    };

    const onEditorFocus = (event) => {
        if (onFocus) {
            onFocus(event);
        }
    };

    const focusEditor = () => {
        if (isOpenEditVariable) {
            return;
        }
        if (editor.current) {
            editor.current.focus();
        }
    };

    useEffect(() => {
        if (ref) {
            if (typeof ref === 'function') {
                ref(editor.current);
            } else {
                ref.current = editor.current;
            }
        }
    }, [editor, ref]);

    const extractVariablesFromText = (text: string) => {
        const variableRegex = /\{\{(.*?)\}\}/g;
        const parts: Array<{ text: string; isVariable: boolean }> = [];
        let lastIndex = 0;
        let match;

        while ((match = variableRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ text: text.slice(lastIndex, match.index), isVariable: false });
            }
            parts.push({ text: match[0], isVariable: true });
            lastIndex = variableRegex.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push({ text: text.slice(lastIndex), isVariable: false });
        }
        return parts;
    };

    const handlePastedText = (
        text: string,
        html: string | undefined,
        editorState: EditorState,
        onChange: (state: EditorState) => void
    ): DraftHandleValue => {
        const contentState = editorState.getCurrentContent();
        let selectionState = editorState.getSelection();
        let newContentState = contentState;

        const parts = extractVariablesFromText(text);

        parts.forEach((part) => {
            if (part.isVariable && initialContent) {
                const variableName = part.text.replace('{{', '').replace('}}', '');

                const variableData: IPart = initialContent[variableName] || { mandatory: false, type: 'default' };

                const entityKey = newContentState
                    .createEntity('VARIABLE', DraftType.MUTABLE, {
                        value: variableName,
                        mandatory: variableData.mandatory,
                        type: variableData.type,
                    })
                    .getLastCreatedEntityKey();

                const endOffset = selectionState.getEndOffset() + part.text.length;
                newContentState = Modifier.insertText(
                    newContentState,
                    selectionState,
                    `{{${variableName}}}`,
                    undefined,
                    entityKey
                );

                selectionState = selectionState.merge({
                    anchorOffset: endOffset,
                    focusOffset: endOffset,
                });
            } else {
                const endOffset = selectionState.getEndOffset() + part.text.length;
                newContentState = Modifier.replaceText(newContentState, selectionState, part.text);

                selectionState = selectionState.merge({
                    anchorOffset: endOffset,
                    focusOffset: endOffset,
                });
            }
        });

        const newEditorState = EditorState.push(editorState, newContentState, 'insert-characters');
        onChange(newEditorState);

        if (editor.current) {
            const editorElement = editor.current;

            setTimeout(() => {
                editorElement.blur();
                editorElement.focus();
            }, 0);
        }

        return 'handled';
    };

    return (
        <div style={{ width: '100%' }}>
            <EditorContent onClick={focusEditor}>
                <Editor
                    ref={editor}
                    editorState={editorState}
                    onChange={handleTextChange}
                    handleKeyCommand={handleKeyCommand}
                    handleBeforeInput={handleBeforeInput}
                    handlePastedText={(text, html) => handlePastedText(text, html, editorState, setEditorState)}
                    spellCheck={true}
                    handleReturn={handleReturn}
                    readOnly={disabled || isOpenEditVariable}
                    preserveSelectionOnBlur={true}
                    onFocus={onEditorFocus}
                />
            </EditorContent>
        </div>
    );
};
const ForwardedFlexTextEditor = forwardRef(FlexTextEditor);

export { ForwardedFlexTextEditor as FlexTextEditor };
