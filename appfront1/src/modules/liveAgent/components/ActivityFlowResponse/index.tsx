import { FC } from 'react';
import { UserAvatar, Wrapper } from '../../../../ui-kissbot-v2/common';
import I18nWrapper from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { Col, Divider, Row, Typography } from 'antd';
import Copy from '../../../../shared/Copy';
import styled from 'styled-components';
import moment from 'moment';

const Input = styled.input`
    border: 1px #c7c7c7 solid;
    border-radius: 5px;
    padding: 4px 6px;
    width: 100%;
    &:disabled {
        background: #fff;
    }
`;

enum FlowFieldTypes {
    '@sys.any' = '@sys.any',
    '@sys.number' = '@sys.number',
    '@sys.text' = '@sys.text',
    '@sys.fullName' = '@sys.fullName',
    '@sys.height' = '@sys.height',
    '@sys.date' = '@sys.date',
    '@sys.time' = '@sys.time',
    '@sys.email' = '@sys.email',
    '@sys.phone' = '@sys.phone',
    '@sys.cpf' = '@sys.cpf',
    '@sys.cnpj' = '@sys.cnpj',
    '@sys.pdf' = '@sys.pdf',
    '@sys.image' = '@sys.image',
    '@sys.file' = '@sys.file',
}

interface ActivityFlowResponseProps {
    content:
        | {
              flowTitle: string;
              pages: {
                  title: string;
                  fields: {
                      label: string;
                      name: string;
                      type: FlowFieldTypes;
                      value: string;
                      view: boolean;
                  }[];
              }[];
          }
        | any;
}

const ActivityFlowResponse: FC<ActivityFlowResponseProps & I18nProps> = ({ getTranslation, content }) => {
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
        navigator.clipboard.writeText(text);
    };

    const fallbackCopyTextToClipboard = (text: string) => {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            document.execCommand('copy');
            document?.body?.removeChild(textArea);
        } catch (err) {}
    };

    const transformValue = (value: string, type: FlowFieldTypes) => {
        switch (type) {
            case '@sys.date':
                return moment(value, moment.ISO_8601, true).isValid() ? moment(value).format('DD/MM/YYYY') : value;

            case '@sys.time':
                return moment(value, 'HH:mm', true).isValid() ? moment(value, 'HH:mm').format('HH:mm') : value;

            default:
                return value;
        }
    };

    if (!content?.pages?.length) {
        return (
            <Wrapper bgcolor='#cfe9ba' padding='10px 20px'>
                <Wrapper flexBox justifyContent='space-between' alignItems='center'>
                    <UserAvatar user={{ name: '!' }} />
                    <Wrapper margin='0 0 0 10px'>
                        {getTranslation('Não foi possível exibir informações do flow')}
                    </Wrapper>
                </Wrapper>
            </Wrapper>
        );
    }
    return (
        <Wrapper padding='10px'>
            <Wrapper flexBox flexDirection='column' justifyContent='center' alignItems='center'>
                <Typography.Title style={{ color: '#696969' }} level={5}>
                    {content.flowTitle}
                </Typography.Title>
                <Row style={{ flexDirection: 'column', maxWidth: '400px', minWidth: '300px' }}>
                    {content.pages.map((page, index) => {
                        return (
                            <Col>
                                <Row style={{ marginBottom: '5px' }}>
                                    <b>{page.title}</b>
                                </Row>
                                {page?.fields?.map((field) => {
                                    if (!field?.view) {
                                        return null;
                                    }

                                    return (
                                        <Row style={{ flexDirection: 'column', marginBottom: '5px' }}>
                                            <Col style={{ marginBottom: '3px' }}>{field.label}</Col>
                                            <Col>
                                                <Input
                                                    id={field.name}
                                                    style={{
                                                        padding: '4px 20px 4px 6px',
                                                    }}
                                                    disabled
                                                    title={transformValue(field.value, field.type)}
                                                    value={transformValue(field.value, field.type)}
                                                />
                                                <Copy
                                                    id={field.name}
                                                    title={getTranslation('Copy')}
                                                    duration={1300}
                                                    onClick={() => copyDivToClipboard(field.name)}
                                                    placement={'top'}
                                                    style={{
                                                        cursor: 'pointer',
                                                        position: 'absolute',
                                                        right: '3px',
                                                        fontSize: '17px',
                                                        top: '3px',
                                                    }}
                                                />
                                            </Col>
                                        </Row>
                                    );
                                })}
                                {index !== content.pages.length - 1 ? <Divider style={{ margin: '15px 0' }} /> : null}
                            </Col>
                        );
                    })}
                </Row>
            </Wrapper>
        </Wrapper>
    );
};

export default I18nWrapper(ActivityFlowResponse) as FC<ActivityFlowResponseProps>;
