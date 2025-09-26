import {
    CompositeDecorator,
    ContentState,
    DraftHandleValue,
    Editor,
    EditorState,
    Modifier,
    SelectionState,
} from 'draft-js';
import { IPart } from 'kissbot-core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BlockResponseText } from '../block-response-text';
import { BlockUserSays } from '../block-user-says';
import { VARIABLE_REGEX } from '../constants/variable-block';
import { DraftType } from '../enum/draft-type.enum';
import { FlexTextType } from '../enum/flex-text-type.enum';
import { useRegexStrategy } from '../use-regex-strategy';

const useEditorState = (
    initialText: string,
    maxLength: number,
    onEntityChange: (contentState: ContentState) => void,
    typeBlock: FlexTextType,
    userSaysParts: IPart[],
    onChangeVariableBlock: (iPart: IPart, start: number, end: number) => void
) => {
    const [editorState, setEditorState] = useState(EditorState.createEmpty());
    const [isOpenEditVariable, setIsOpenEditVariable] = useState<boolean>(false);
    const [isExistIPart, setIsExistIPart] = useState<boolean>(false);
    const handleStrategy = useRegexStrategy(VARIABLE_REGEX);
    const editor: React.RefObject<Editor> = useRef<Editor | null>(null);

    const handleTextChange = (state: EditorState) => {
        const content = state.getCurrentContent();
        const plainText = content.getPlainText();

        if (plainText.length <= maxLength) {
            setEditorState(state);

            if (onEntityChange) {
                onEntityChange(content);
            }
        }
    };

    const onChange = (currEditorState: EditorState) => {
        getSelection();
        const content = currEditorState.getCurrentContent();
        const plainText = content.getPlainText();
        if (isOpenEditVariable || plainText.length > maxLength) {
            return;
        }

        setEditorState(currEditorState);
    };

    const addEntitiesToVariables = (editorState: EditorState, initialText: string) => {
        let newEditorState = editorState;
        let contentState = editorState.getCurrentContent();
        const processedVariables = new Set();

        const replaceVariable = (match: string, value: string): string => {
            const part = userSaysParts.find((part) => {
                const uniqueIdentifier = `${part.value}_${part.type}_${part.mandatory}`;
                return part?.value === value && !processedVariables.has(uniqueIdentifier);
            });

            if (!part) {
                return match;
            }

            const blockMap = contentState.getBlockMap();
            blockMap.forEach((block) => {
                if (!block) return;
                const blockKey = block.getKey();
                const text = block.getText();

                let start = 0;
                while ((start = text.indexOf(match, start)) >= 0) {
                    const selectionStart = start;
                    const selectionEnd = start + match.length;

                    const contentStateWithEntity = newEditorState
                        .getCurrentContent()
                        .createEntity('VARIABLE', 'IMMUTABLE', part);
                    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
                    if (entityKey) {
                        const newContentState = Modifier.applyEntity(
                            contentStateWithEntity,
                            SelectionState.createEmpty(blockKey).merge({
                                anchorOffset: selectionStart,
                                focusOffset: selectionEnd,
                            }),
                            entityKey
                        );

                        newEditorState = EditorState.push(newEditorState, newContentState, 'apply-entity');

                        start = selectionEnd;
                    }
                }
            });

            const uniqueIdentifier = `${part.value}_${part.type}_${part.mandatory}`;
            processedVariables.add(uniqueIdentifier);

            return match;
        };

        initialText.replace(/{{([^}]+)}}/g, (match, variableName) => replaceVariable(match, variableName));
        return newEditorState;
    };

    const handleReturn = (e: any, editorState: EditorState): DraftHandleValue => {
        const currentContent = editorState.getCurrentContent();
        const selection = editorState.getSelection();

        const newContent = Modifier.insertText(currentContent, selection, '\n');
        const newEditorState = EditorState.push(editorState, newContent, 'insert-characters');
        handleTextChange(newEditorState);

        return 'handled';
    };

    const createEditorStateFromHTML = useCallback(() => {
        const entityMapVariables = userSaysParts?.map((variable) => {
            const hasTypeAndMandatory = variable?.type && typeof variable?.mandatory !== 'undefined';

            const data = {
                value: hasTypeAndMandatory ? `{{${variable.value}}}` : variable.value,
                variable: {
                    value: variable?.value,
                    name: variable?.name,
                    type: variable?.type,
                    mandatory: variable?.mandatory,
                },
            };

            if (hasTypeAndMandatory) {
                return { type: 'VARIABLE', mutability: DraftType.MUTABLE, data };
            } else {
                return { type: 'TEXT', mutability: DraftType.IMMUTABLE, data };
            }
        });
        const contentState = ContentState.createFromText(initialText);
        const contentWithEntities = entityMapVariables.reduce((content, entity) => {
            const contentStateWithEntity = content.createEntity(entity.type, entity.mutability, entity.data);
            const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
            return Modifier.applyEntity(contentStateWithEntity, contentStateWithEntity.getSelectionAfter(), entityKey);
        }, contentState);

        return contentWithEntities;
    }, [initialText, userSaysParts]);

    useEffect(() => {
        let decorators: CompositeDecorator | undefined;
        if (typeBlock === FlexTextType.CREATE) {
            decorators = new CompositeDecorator([
                {
                    strategy: handleStrategy,
                    component: (props) => (
                        <BlockUserSays
                            userSaysParts={userSaysParts}
                            typeBlock={typeBlock}
                            onChangeVariableBlock={onChangeVariableBlock}
                            setOpenEditVariable={setIsOpenEditVariable}
                            props={{ ...props }}
                        />
                    ),
                },
            ]);
        } else if (typeBlock === FlexTextType.SELECT) {
            decorators = new CompositeDecorator([
                {
                    strategy: handleStrategy,
                    component: (props) => (
                        <BlockResponseText
                            onChangeVariableBlock={onChangeVariableBlock}
                            setOpenEditVariable={setIsOpenEditVariable}
                            props={{ ...props }}
                        />
                    ),
                },
            ]);
        }

        // if (editorState.getCurrentContent().getPlainText() !== initialText) {
        const contentState = createEditorStateFromHTML();
        const newState = EditorState.createWithContent(contentState, decorators);
        const newEditorState = addEntitiesToVariables(newState, initialText);

        setEditorState(newEditorState);
        // }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        editorState,
        setEditorState,
        isOpenEditVariable,
        setIsOpenEditVariable,
        isExistIPart,
        setIsExistIPart,
        onChange,
        editor,
        handleTextChange,
        handleReturn,
    };
};

export { useEditorState };
