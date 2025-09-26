import {
    CompositeDecorator,
    ContentState,
    convertFromHTML,
    convertToRaw,
    DraftHandleValue,
    Editor,
    EditorState,
    Modifier,
    SelectionState,
} from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { blockStyleFn } from '../../../../../../shared-v2/flex-text-editor/constants/block-style';
import { VARIABLE_REGEX } from '../../../../../../shared-v2/flex-text-editor/constants/variable-block';
import { DraftType } from '../../../../../../shared-v2/flex-text-editor/enum/draft-type.enum';
import { FlexTextType } from '../../../../../../shared-v2/flex-text-editor/enum/flex-text-type.enum';
import { useEditorStyles } from '../../../../../../shared-v2/flex-text-editor/use-editor-styles';
import { useFocusHandler } from '../../../../../../shared-v2/flex-text-editor/use-focus-handler';
import { useRegexStrategy } from '../../../../../../shared-v2/flex-text-editor/use-regex-strategy';
import { useSelectionHandling } from '../../../../../../shared-v2/flex-text-editor/use-selection-handling';
import { getWhatsAppFormatting } from '../../../../../../utils/Activity';
import { useLanguageContext } from '../../../../../i18n/context';
import EmojiSelector from '../../../../../liveAgent/components/EmojiSelector';
import { NewVariable } from '../../../../../liveAgent/components/TemplateMessageList/interface';
import Block from './components/Block';
import { useInlineStyles } from './hooks/use-style-inline';
import { DraftEditorProps, InlineStyleType } from './props';
import { CharacterCounter, ControlsContent, EditorContent, EmoticonIcon, Icon, StyledToolbar } from './styles';

const typeEditor: FlexTextType = FlexTextType.TEMPLATE;

export const DraftEditor = forwardRef((props: DraftEditorProps, ref) => {
    const {
        initialValue,
        onChange,
        variables,
        onChangeVariable,
        maxLength,
        isHsm,
        disabled,
        onFocus,
        toolbarOnFocus,
        onBlur,
        setActiveModal,
        templateCategory,
    } = props;
    const [editorFocused, setEditorFocused] = useState(false);
    const [editorState, setEditorState] = useState(EditorState.createEmpty());
    const [openedEmoji, setOpenedEmoji] = useState(false);
    const [openEditVariable, setOpenEditVariable] = useState(false);
    const textLength = editorState.getCurrentContent().getPlainText().length;
    const editor: any = useRef(null);
    const { getTranslation } = useLanguageContext();

    const handleStrategy = useRegexStrategy(VARIABLE_REGEX);

    const decorators = new CompositeDecorator([
        {
            strategy: handleStrategy,
            component: (props) => {
                return (
                    <Block
                        onChangeVariable={(variable, start, end) => {
                            convertValueBlock(variable.value, start, end);
                            onChangeVariable(variable);
                        }}
                        setOpenEditVariable={setOpenEditVariable}
                        isHsm={isHsm}
                        props={{ ...props }}
                    />
                );
            },
        },
    ]);

    const convertValueBlock = (value: string, start: number, end: number) => {
        const data: NewVariable = { value: `{{${value}}}` };
        const content = editor.current.props.editorState.getCurrentContent();
        const selection = editor.current.props.editorState.getSelection();
        let mentionTextSelection = selection.merge({
            anchorOffset: start,
            focusOffset: end,
        });
        const contentStateWithEntity = content.createEntity('VARIABLE', DraftType.MUTABLE, data);
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
        const blockKey = selection.getStartKey();
        const currentInlineStyle = content.getBlockForKey(blockKey).getInlineStyleAt(start);
        const textWithEntity = Modifier.replaceText(
            contentStateWithEntity,
            mentionTextSelection,
            `{{${value}}}`,
            currentInlineStyle,
            entityKey
        );
        const newState = EditorState.push(editor.current.props.editorState, textWithEntity, 'insert-characters');
        onChangeEditor(EditorState.forceSelection(newState, textWithEntity.getSelectionAfter()));
    };

    const insertFieldEntry = (style: string, type: DraftType, name: string) => {
        let data: any = { value: name };
        if (style === 'VARIABLE') {
            const textValue = name?.replace(/[{,}]/g, '');
            data = { value: name, variable: { value: textValue, label: textValue } };
        }
        const content = editorState.getCurrentContent();
        const selection = editorState.getSelection();
        const contentStateWithEntity = content.createEntity(style, type, data);
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
        const textWithEntity = Modifier.insertText(content, selection, name, undefined, entityKey);
        const newState = EditorState.push(editorState, textWithEntity, 'insert-characters');
        return EditorState.forceSelection(newState, textWithEntity.getSelectionAfter());
    };

    const onEmojiSelected = (emoji: string) => {
        const isCollapsed = editorState.getSelection().isCollapsed();

        if (!isCollapsed || textLength >= maxLength || disabled) {
            return;
        }
        const newState = insertFieldEntry('EMOJI', DraftType.IMMUTABLE, emoji);
        setEditorState(newState as EditorState);
    };

    useImperativeHandle(ref, () => ({
        insertSuggestion,
    }));

    const handlePastedText = (text: string, html: string, state: EditorState): DraftHandleValue => {
        if (!text || !state) return 'not-handled';
        
        const selection = state.getSelection();
        const content = state.getCurrentContent();
        const currentText = content.getPlainText() || '';
        const textLength = currentText.length;

        let selectedLength = 0;
        if (!selection.isCollapsed()) {
            const startKey = selection.getStartKey();
            const endKey = selection.getEndKey();
            if (startKey === endKey) {
                selectedLength = selection.getEndOffset() - selection.getStartOffset();
            } else {
                const blockMap = content.getBlockMap();
                let reachedStart = false;
                let reachedEnd = false;
                blockMap.forEach((block, key) => {
                    if (!block) return;
                    if (key === startKey) reachedStart = true;

                    if (reachedStart && !reachedEnd) {
                        const length = block?.getLength() || 0;

                        if (key === startKey && key === endKey) {
                            selectedLength += selection.getEndOffset() - selection.getStartOffset();
                        } else if (key === startKey) {
                            selectedLength += length - selection.getStartOffset();
                        } else if (key === endKey) {
                            selectedLength += selection.getEndOffset();
                            reachedEnd = true;
                        } else {
                            selectedLength += length;
                        }
                    }
                });
            }
        }

        const newLength = textLength - selectedLength + text.length;
        const overflowChars = newLength - maxLength;

        // Convert pasted text with WhatsApp formatting
        const formattedText = getWhatsAppFormatting(text) || text;

        // Handle text overflow
        if (overflowChars > 0) {
            const allowedText = text.substring(0, text.length - overflowChars);
            const formattedAllowedText = getWhatsAppFormatting(allowedText) || allowedText;

            // Convert HTML to draft content blocks
            const blocksFromHTML = convertFromHTML(formattedAllowedText);
            const newContentState = ContentState.createFromBlockArray(
                blocksFromHTML.contentBlocks || [],
                blocksFromHTML.entityMap || {}
            );

            // Replace selection with formatted content
            const newContent = Modifier.replaceWithFragment(content, selection, newContentState.getBlockMap());

            setEditorState(EditorState.push(state, newContent, 'insert-fragment'));
            return 'handled';
        }

        // Handle normal paste with formatting
        const blocksFromHTML = convertFromHTML(formattedText);
        const newContentState = ContentState.createFromBlockArray(
            blocksFromHTML.contentBlocks || [],
            blocksFromHTML.entityMap || {}
        );

        // Replace selection with formatted content
        const newContent = Modifier.replaceWithFragment(content, selection, newContentState.getBlockMap());

        setEditorState(EditorState.push(state, newContent, 'insert-fragment'));
        return 'handled';
    };

    const insertSuggestion = (suggestion: string) => {
        const content = editorState.getCurrentContent();

        const selection = SelectionState.createEmpty(content.getFirstBlock().getKey()).merge({
            anchorOffset: 0,
            focusKey: content.getLastBlock().getKey(),
            focusOffset: content.getLastBlock().getLength(),
            isBackward: false,
        });

        // Format the suggestion text to convert markdown (*bold*, _italic_, etc) to HTML
        const formattedText = getWhatsAppFormatting(suggestion);

        // Convert formatted HTML to draft content blocks
        const blocksFromHTML = convertFromHTML(formattedText);
        const newContentState = ContentState.createFromBlockArray(
            blocksFromHTML.contentBlocks,
            blocksFromHTML.entityMap
        );

        // Replace selection with formatted content
        const newContent = Modifier.replaceWithFragment(content, selection, newContentState.getBlockMap());

        const newEditorState = EditorState.push(editorState, newContent, 'insert-fragment');

        setEditorState(EditorState.forceSelection(newEditorState, newContent.getSelectionAfter()));
    };

    const onChangeEditor = (currEditorState: EditorState) => {
        getSelection();
        const textLength = currEditorState.getCurrentContent().getPlainText().length;

        if (openEditVariable || textLength > maxLength) {
            return;
        }

        setEditorState(currEditorState);
    };

    const { onInlineClick, isStyleActive } = useEditorStyles(
        editorState,
        setEditorState,
        textLength,
        maxLength,
        disabled,
        insertFieldEntry
    );

    const { handleBeforeInput, handleKeyCommand } = useSelectionHandling(
        editorState,
        setEditorState,
        maxLength,
        typeEditor
    );

    const { isEditorFocused, onInputMouseDown, isToolbarFocused, onEditorMouseDown, isEditorBlur } = useFocusHandler();

    const onEditorBlur = () => setEditorFocused(false);

    const onEditorFocus = (event: React.FocusEvent<Element>) => {
        setEditorFocused(true);
        if (onFocus && isEditorFocused()) {
            onFocus(event);
        }
    };

    const onWrapperBlur = (event: React.FocusEvent<Element>) => {
        if (onBlur && isEditorBlur(event as unknown as Event)) {
            onBlur(event);
        }
    };

    const preventDefault = (event: React.MouseEvent) => {
        const target = event.target as HTMLElement;

        if (target.tagName === 'INPUT' || target.tagName === 'LABEL') {
            onInputMouseDown();
        } else {
            event.preventDefault();
        }
    };

    const onToolbarFocus = (event: React.FocusEvent<Element>) => {
        if (onFocus && isToolbarFocused()) {
            onFocus(event);
        }
    };

    const focusEditor = () => {
        if (openEditVariable) {
            return;
        }
        setTimeout(() => {
            editor.current.focus();
        });
    };

    const INLINE_STYLES = useInlineStyles(templateCategory);

    useEffect(() => {
        const convertText = (state: EditorState) => {
            let contentState = state.getCurrentContent();
            const editorContentRaw = convertToRaw(contentState);

            const markup = draftToHtml(editorContentRaw, undefined, undefined, editorState);

            let text = markup;
            text = text.replaceAll('<p>', '');
            text = text.replaceAll('</p>', '');
            text = text.replaceAll('<strong>', '*');
            text = text.replaceAll('</strong>', '*');
            text = text.replaceAll('<em>', '_');
            text = text.replaceAll('</em>', '_');
            text = text.replaceAll('<del>', '~');
            text = text.replaceAll('</del>', '~');
            text = text.replaceAll('<code>', '```');
            text = text.replaceAll('</code>', '```');
            text = text.replaceAll('<br>', '\n');
            text = text.replaceAll('&nbsp;', ' ');

            return text;
        };

        const value = convertText(editorState);

        onChange(value);
    }, [editorState]);

    useEffect(() => {
        const html = getWhatsAppFormatting(initialValue);
        const entityMapVariables = variables?.map((variable) => {
            const data = {
                value: `{{${variable.value}}}`,
                variable: {
                    value: variable?.value,
                    label: variable?.label,
                    required: true,
                    type: variable?.type,
                    _id: variable?._id,
                },
            };
            return { type: 'VARIABLE', mutability: DraftType.IMMUTABLE, data };
        });
        const blocksFromHTML = convertFromHTML(html);
        const entitys = entityMapVariables.length ? entityMapVariables : blocksFromHTML.entityMap;
        const content = ContentState.createFromBlockArray(blocksFromHTML.contentBlocks, entitys);
        const newState = EditorState.createWithContent(content, decorators);

        setEditorState(newState);
    }, [initialValue]);

    return (
        <div onBlur={onWrapperBlur}>
            <EditorContent onClick={focusEditor} onMouseDown={onEditorMouseDown}>
                <Editor
                    ref={editor}
                    editorState={editorState}
                    onChange={onChangeEditor}
                    handlePastedText={handlePastedText}
                    handleBeforeInput={handleBeforeInput}
                    handleKeyCommand={handleKeyCommand}
                    spellCheck={true}
                    readOnly={disabled || openEditVariable}
                    preserveSelectionOnBlur={true}
                    onFocus={onEditorFocus}
                    onBlur={onEditorBlur}
                    blockStyleFn={blockStyleFn}
                />
            </EditorContent>
            <StyledToolbar toolbarShow={true} onMouseDown={preventDefault} onFocus={onToolbarFocus}>
                <CharacterCounter>{`${textLength}/${maxLength} ${getTranslation('characters')}`}</CharacterCounter>
                <ControlsContent>
                    <EmojiSelector
                        onSelect={onEmojiSelected}
                        opened={openedEmoji}
                        onClose={() => setOpenedEmoji(false)}
                    >
                        <Icon
                            title={'emoticons'}
                            onClick={() => {
                                setOpenedEmoji(!openedEmoji);
                            }}
                        >
                            <EmoticonIcon />
                        </Icon>
                    </EmojiSelector>
                    {INLINE_STYLES.map((type, index) => {
                        const isActive = isStyleActive(type.style);
                        return (
                            <Icon
                                key={`${type.label}-${index}`}
                                onClick={() => {
                                    if (textLength >= maxLength) {
                                        return;
                                    }
                                    if (
                                        type.style === InlineStyleType.AI_SUGGESTION ||
                                        type.style === InlineStyleType.AI_INSIGHT
                                    ) {
                                        setActiveModal(type.style);
                                        return;
                                    }
                                    onInlineClick(type.style);
                                }}
                                active={isActive}
                                title={type.tooltip}
                            >
                                {type.label}
                            </Icon>
                        );
                    })}
                </ControlsContent>
            </StyledToolbar>
        </div>
    );
});
