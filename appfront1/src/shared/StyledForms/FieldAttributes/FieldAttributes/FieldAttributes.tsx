import { Component } from 'react';
import { Editor, Value } from 'slate';
import { Editor as BaseEditor } from 'slate-react';
import SoftBreak from 'slate-soft-break';
import styled from 'styled-components';
import { IPart } from '../../../../model/Interaction';
import { AttrNode } from '../AttrNode/AttrNode';
import { FieldAttributesPart, FieldAttributesProps, FieldAttributesState } from './FieldAttributesProps';

const StyledEditor = styled(BaseEditor)<any>`
    position: relative;
    width: 100%;
    border: 1px var(--color9) solid;
    box-sizing: border-box;
    display: flex;
    flex-wrap: wrap;
    outline: none;
    box-shadow: 0 2px 15px 0 rgba(0, 0, 0, 0.07);
    border: 1px solid #fff;
    background: var(--color8);
    color: var(--color7);
    padding: 9px 24px 9px 19px;
    font-size: 15px;
    font-weight: 400;
    line-height: 22px;
    min-height: 40px;
    max-height: none;
    border-radius: 6px;
    transition: border 0.3s, color 0.3s;
    word-break: break-word;
    word-wrap: break-word;
    white-space: pre-wrap;
`;

const slatePlugins = [SoftBreak()];

const slateNoPlugins = [];

export class FieldAttributes extends Component<FieldAttributesProps, FieldAttributesState> {
    ATTR_TYPE = 'attr';

    componentWillMount() {
        this.setFirstNodes();
    }

    setFirstNodes = () => {
        let parts: Array<FieldAttributesPart> = this.getNodesParts();
        const nodes = parts
            .map((part) => {
                if (!part.value) return undefined;
                if (!!part.type || part.isHandlebars) {
                    return this.addBlock(this.ATTR_TYPE, part.value, part);
                }
                return this.addBlock('span', part.value);
            })
            .filter((part) => part !== undefined);
        //Sempre adicionar um block em branco no final do nodes
        nodes.push(this.addBlock('span', ' '));
        const value = Value.fromJSON({
            document: {
                nodes,
            },
        } as any);
        this.setState({ value, isSomeModalOpened: false });
    };

    checkIsAttr = (editor) => {
        return editor.value.startBlock && editor.value.startBlock.type === this.ATTR_TYPE;
    };

    checkToDeleteEntireAttr = (ev, editor, next?: any) => {
        if (ev.key === 'Backspace' && this.checkIsAttr(editor)) {
            if (editor.value.startBlock) {
                editor.moveFocusToStartOfNode(editor.value.startBlock).delete().deleteWordBackward();
            }
        }
    };

    getMatch = (toMatch, { selection, startText }) => {
        const { start } = selection;
        if (startText && startText.text) {
            const { text } = startText;
            const string = text.slice(0, start.offset);
            let match = string.match(toMatch);
            if (match) match[0] = match[0].replace(/^\s+/, '');
            return match;
        }
        return null;
    };

    insertAttrBlock = (ev, editor, next) => {
        if (editor.value.startBlock && editor.value.startBlock.type === this.ATTR_TYPE) return next();

        /** find match brackets */
        const match = this.getMatch('{{', editor.value);
        if (!match) return next();

        /** get brackets offset position */
        const { start } = editor.value.selection;
        let startOffset = start.offset;
        let totalRemoved = 0;
        const length = 2;

        /** move anchor and delete */
        editor
            .moveAnchorTo(startOffset - length)
            .moveFocusTo(startOffset)
            .delete();

        totalRemoved += length;
        startOffset -= totalRemoved;

        /** add custom attr block */
        editor
            .moveTo(startOffset)
            .insertBlock(this.addBlock(this.ATTR_TYPE, 'value', { value: 'value', type: '@sys.any' }))
            .insertBlock(this.addBlock('span', ' '))
            .moveFocusToStartOfNode(editor.value.startBlock)
            .delete();

        return next();
    };

    addBlock = (type, text, data?) => ({
        object: 'block',
        type,
        data,
        nodes: [
            {
                object: 'text',
                leaves: [
                    {
                        text,
                    },
                ],
            },
        ],
    });

    checkToJumpTroughtAttr = (ev, editor: Editor | any) => {
        const { startBlock } = editor.value;
        const isAttr = this.checkIsAttr(editor);
        if (isAttr && ev.key === 'ArrowLeft' && startBlock) {
            editor.moveAnchorToEndOfPreviousBlock(startBlock);
        }
        if (isAttr && ev.key === 'ArrowRight' && startBlock) {
            editor.moveAnchorToStartOfNextBlock(startBlock);
        }
    };

    onKeyUp = (ev, editor, next) => {
        this.checkToDeleteEntireAttr(ev, editor, next);
        this.checkToJumpTroughtAttr(ev, editor);
        this.insertAttrBlock(ev, editor, next);
        return next();
    };

    onChangeAttrNode = (editor: BaseEditor | any, node, text, data?) => {
        editor
            .moveToRangeOfNode(node)
            .moveFocusToStartOfNode(editor.value.startBlock)
            .delete()
            .insertBlock(this.addBlock(this.ATTR_TYPE, text, data));
    };

    renderNode = (props, editor, next) => {
        return props.node.type === this.ATTR_TYPE ? (
            <AttrNode
                data={props.node.data.toJSON()}
                type={this.props.type}
                nodeChildren={props.children}
                onChange={(text, data) => {
                    this.onChangeAttrNode(editor, props.node, text, data);
                }}
            />
        ) : (
            next()
        );
    };

    onChange = ({ value }) => {
        this.setState({ value });
        this.props.onChange(this.serialize(value));
    };

    serialize = (value) => {
        if (this.props.type === 'SELECT') {
            return this.serializeToText(value.toJSON());
        }
        if (this.props.type === 'CREATE') {
            return this.serializeToParts(value.toJSON());
        }
    };

    serializeToParts = (value) => {
        const parts: Array<IPart> = value.document.nodes
            .map((node) => {
                if (node.type === this.ATTR_TYPE) {
                    return { value: node.data.value, type: node.data.type, mandatory: !!node.data.mandatory } as IPart;
                }
                return {
                    value: node.nodes[0].leaves[0].text,
                } as IPart;
            })
            .filter((part) => part.value !== '');
        //.filter(part => part.value != "" && part.value != " ");
        return parts;
    };

    serializeToText = (value) => {
        let stringValue: string = '';
        value.document.nodes.forEach((node) => {
            let text = node.nodes[0].leaves[0].text;
            if (node.type === this.ATTR_TYPE) {
                text = `{{${text}}}`;
            }
            stringValue += text;
        });
        return stringValue;
    };

    separeTextByHandlebars = (text, arrayValues: Array<string> = []): Array<any> => {
        const regex = /\{\{([^}]+)\}\}/g;
        const match = regex.exec(text);
        if (match && match[0]) {
            let splittedText = text.split(match[0]);
            if (splittedText && splittedText[0]) {
                arrayValues.push(splittedText[0]);
            }
            arrayValues.push('{{' + match[1]);
            this.separeTextByHandlebars(splittedText[1], arrayValues);
        } else if (text !== '') {
            arrayValues.push(text);
        }
        return arrayValues;
    };

    transformTextIntoParts = (): Array<FieldAttributesPart> => {
        const arrayOfStrings: Array<string> = this.separeTextByHandlebars(this.props.value);
        return arrayOfStrings.map((text) => {
            let isHandlebars = false;
            if (text.startsWith('{{')) {
                text = text.split('{{')[1];
                isHandlebars = true;
            }
            return {
                value: text,
                isHandlebars,
            };
        }) as Array<FieldAttributesPart>;
    };

    getNodesParts = (): Array<FieldAttributesPart> => {
        let parts: Array<FieldAttributesPart> = [
            ...(this.props.value as Array<FieldAttributesPart>),
        ] as Array<FieldAttributesPart>;
        if (typeof this.props.value == 'string') {
            parts = this.transformTextIntoParts();
        }
        const firstPart = parts && parts[0] ? parts[0] : undefined;
        if (firstPart && (firstPart.isHandlebars || !!firstPart.type)) {
            parts.unshift({ value: ' ' });
        }
        return parts;
    };

    render() {
        return (
            <StyledEditor
                value={this.state.value}
                onChange={this.onChange}
                onKeyUp={this.onKeyUp}
                renderNode={this.renderNode}
                // Deve usar um array de plugins fora do contexto da classe
                // pois o slate quebra ao passar uma instância de plugin a cada re render como o exemplo abaixo
                // plugins={[
                //      SoftBreak()
                // ]}
                // Como só vai ser usado o plugin de quebra de linha no tipo SELECT, tem que
                // criar um slateNoPlugin array vazio
                plugins={this.props.type === 'SELECT' ? slatePlugins : slateNoPlugins}
            />
        );
    }
}
