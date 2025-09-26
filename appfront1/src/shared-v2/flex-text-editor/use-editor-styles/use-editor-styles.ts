import { EditorState, RichUtils } from 'draft-js';
import { useTemplateVariableContext } from '../../../modules/settings/components/Template/components/DraftEditor/context';
import { InlineStyleType } from '../../../modules/settings/components/Template/components/DraftEditor/props';
import { DraftType } from '../enum/draft-type.enum';
import { IPartDefault } from '../enum/i-part-default.enum';

const useEditorStyles = (editorState, setEditorState, textLength, maxLength, disabled, insertFieldEntry) => {
    const { templateVariables } = useTemplateVariableContext();
    const onInlineClick = (style: InlineStyleType) => {
        if (style === 'VARIABLE') {
            const isCollapsed = editorState.getSelection().isCollapsed();
            if (!isCollapsed) {
                return;
            }
            const newState = insertFieldEntry(
                'VARIABLE',
                DraftType.IMMUTABLE,
                `{{${IPartDefault.variavel}_${templateVariables.length + 1}}}`
            );
            setEditorState(newState as EditorState);

            return;
        }

        if (textLength >= maxLength || disabled) {
            return;
        }

        const newEditorState = RichUtils.toggleInlineStyle(editorState, style);

        setEditorState(newEditorState);
    };

    const isStyleActive = (style: InlineStyleType) => {
        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        if (!selection.isCollapsed()) {
            return (
                selection.getFocusKey() === selection.getAnchorKey() && editorState.getCurrentInlineStyle().has(style)
            );
        }

        const blockKey = selection.getStartKey();
        const offset = selection.getStartOffset();
        return content.getBlockForKey(blockKey).getInlineStyleAt(offset).has(style);
    };

    return {
        onInlineClick,
        isStyleActive,
    };
};

export { useEditorStyles };
