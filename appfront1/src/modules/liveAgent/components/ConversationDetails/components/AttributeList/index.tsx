import { message } from 'antd';
import orderBy from 'lodash/orderBy';
import partition from 'lodash/partition';
import moment from 'moment';
import { FC, useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { v4 } from 'uuid';
import Copy from '../../../../../../shared/Copy';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import AccessMedicalRecord from '../AccessMedicalRecord';
import CardWrapper from '../CardWrapper';
import { Label } from '../Common/common';
import { AttributeListProps } from './props';

const Input = styled.input`
    border: 1px #c7c7c7 solid;
    border-radius: 5px;
    padding: 4px 6px;
    width: 100%;
    &:disabled {
        background: #fff;
    }
`;

const AttributeList: FC<AttributeListProps & I18nProps> = ({ getTranslation, attributes }) => {
    const valideAttributes = useCallback(() => {
        const validAttributes: any[] = [];
        attributes
            ?.filter((attr) => !!attr.label?.trim() && !!attr.value)
            ?.forEach((attr) => {
                if (attr.type === '@sys.date' && moment(attr.value).isValid()) {
                    return validAttributes.push({
                        ...attr,
                        value: moment(attr.value).format('DD/MM/YYYY'),
                    });
                }
                validAttributes.push(attr);
            });

        return validAttributes;
    }, [attributes]);

    const [validAttributes, setValidAttributes] = useState(valideAttributes());

    useEffect(() => {
        setValidAttributes(valideAttributes());
    }, [valideAttributes]);

    const copyDivToClipboard = (id: any) => {
        const currentElement: any = document.getElementById(id);
        if (!currentElement || !document.hasFocus()) return;

        copyTextToClipboard(currentElement.value);
    };

    const copyTextToClipboard = (text: string) => {
        if (!document.hasFocus()) {
            return;
        }

        if (!navigator.clipboard) {
            return fallbackCopyTextToClipboard(text);
        }
        navigator.clipboard
            .writeText(text)
            .then(() => {
                message.success(getTranslation('Attribute copied successfully!'));
            })
            .catch(() => {
                message.error(getTranslation('Error copying attribute!'));
            });
    };

    const fallbackCopyTextToClipboard = (text: string) => {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document?.body?.removeChild(textArea);

            if (successful) {
                message.success(getTranslation('Attribute copied successfully!'));
            } else {
                message.error(getTranslation('Error copying attribute!'));
            }
        } catch (err) {
            message.error(getTranslation('Error copying attribute!'));
        }
    };

    const orderAttributes = () => {
        const newAttributeList: any = [];

        let arrayList = partition(orderBy(validAttributes, 'label'), { type: '@sys.command' });

        arrayList.forEach((array) => {
            array.forEach((elem) => newAttributeList.push(elem));
        });

        return newAttributeList;
    };

    return validAttributes?.length > 0 ? (
        <CardWrapper>
            <Label title={`${getTranslation('Attributes')}`}>{`${getTranslation('Attributes')}:`}</Label>
            {orderAttributes().map((attr) => {
                const id = `clipboard-area-${v4()}`;
                const idCopy = `copy-${v4()}`;

                return attr.type === '@sys.command' ? (
                    <AccessMedicalRecord attribute={attr} />
                ) : (
                    <Wrapper key={v4()} margin='0 5px'>
                        <Wrapper margin='5px 0'>
                            <Wrapper margin='9px 0 4px 0px' color='#444' fontSize='12px' title={attr.label}>
                                {attr.label || '--'}
                            </Wrapper>
                            <Wrapper position='relative'>
                                <Input
                                    id={id}
                                    style={{
                                        padding: '4px 20px 4px 6px',
                                    }}
                                    disabled
                                    title={attr.value}
                                    value={attr.value}
                                />
                                <Copy
                                    id={idCopy}
                                    title={getTranslation('Copy')}
                                    duration={1300}
                                    onClick={() => copyDivToClipboard(id)}
                                    placement={'topLeft'}
                                    style={{
                                        cursor: 'pointer',
                                        position: 'absolute',
                                        right: '3px',
                                        fontSize: '17px',
                                        top: '3px',
                                    }}
                                />
                            </Wrapper>
                        </Wrapper>
                    </Wrapper>
                );
            })}
        </CardWrapper>
    ) : null;
};

export default i18n(AttributeList) as FC<AttributeListProps>;
