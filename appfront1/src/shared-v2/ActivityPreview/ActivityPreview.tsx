import { FC } from 'react';
import styled from 'styled-components';
import { getWhatsAppFormatting, parseMarkDown } from '../../utils/Activity';
import moment from 'moment';
import { Col, Divider, Row } from 'antd';
import * as Handlebars from 'handlebars/dist/cjs/handlebars';
import { TemplateButtonType, TemplateVariable } from '../../modules/liveAgent/components/TemplateMessageList/interface';
import { set } from 'lodash';
import { useSelector } from 'react-redux';
import ReactPlayer from 'react-player';
import { FiFile } from 'react-icons/fi';
import { formatBytes } from '../../utils/formatBytes';
import { MdOutlineReply } from 'react-icons/md';
import { BiLinkExternal } from 'react-icons/bi';
import { TfiMenuAlt } from 'react-icons/tfi';
import { useLanguageContext } from '../../modules/i18n/context';

const Div = styled.div`
    min-width: 300px;
    height: max-content;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    padding: 20px 20px 20px 10px;
    z-index: 0;
    background-image: url('/assets/img/background-whats.png');
    background-repeat: repeat;
`;

const Balloon = styled('div')<any>`
    min-width: 150px;
    max-width: 220px;
    display: flex;
    justify-content: space-between;
    position: relative;
    flex-direction: column;
    border-radius: 0.4em;
    font-size: 13px;
    padding: 8px 10px 10px 11px;
    color: #696969;
    word-wrap: break-word;

    background: #fff;
    margin-left: 15px;

    -webkit-box-shadow: 4px 5px 5px -6px rgba(0, 0, 0, 0.4);
    -moz-box-shadow: 4px 5px 5px -6px rgba(0, 0, 0, 0.4);
    box-shadow: 4px 5px 5px -6px rgba(0, 0, 0, 0.4);

    &:after {
        content: '';
        position: absolute;
        top: -9px;
        left: -9px;
        border: 18px solid transparent;
        border-right-color: #fff;
        border-left: 0;
        border-radius: 5px;
        rotate: -90deg;
    }
`;

const ActivityTimestamp = styled.div`
    display: flex;
    justify-content: flex-end;
    margin: 0 0 -7px 0;
    font-size: 11px;
    color: #696969e0;
`;

const ButtonWhats = styled(Col)`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 35px;
    color: #1890ff;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    background: #fff;
    /* border-radius: 5px; */
    /* margin: 2px; */
    /* 
    -webkit-box-shadow: 4px 5px 5px -6px rgba(0, 0, 0, 0.4);
    -moz-box-shadow: 4px 5px 5px -6px rgba(0, 0, 0, 0.4);
    box-shadow: 4px 5px 5px -6px rgba(0, 0, 0, 0.4); */

    :hover {
        color: #188fffcb;
    }
`;

const ContentFile = styled(Row)`
    min-height: 40px;
    max-height: 110px;
    margin-bottom: 5px;

    video {
        border-radius: 8px;
    }

    .text {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        width: 150px;

        @supports (-webkit-line-clamp: 2) {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: initial;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }
    }
`;

const ContentButtons = styled(Row)`
    margin: -3px 0 0 15px;
    padding-bottom: 3px;
    border-top: 1px solid #e5e5eaeb;
    min-width: 150px;
    max-width: 220px;
    z-index: 1;
    border-radius: 0 0 5px 5px;
    background: #fff;
    justify-content: center;
`;

const IconFile = styled(FiFile)`
    font-size: 20px;
    color: #696969;
    margin-right: 10px;
`;

const ReactPlayerDiv = styled(ReactPlayer)``;

export const defaultVariablesTemplate = [
    'agent.name',
    'conversation.iid',
    'conversation.createdAt',
    'user.name',
    'user.phone',
];

interface ActivityPreviewProps {
    message: string;
    buttons?: { text: string; type: TemplateButtonType }[];
    variables?: any[];
    file?: {
        type: string;
        url: string;
        name: string;
        size: number;
    };
    footerMessage?: string;
}

const ActivityPreview: FC<ActivityPreviewProps> = (props) => {
    const { message, buttons, variables, file, footerMessage } = props;
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const { getTranslation } = useLanguageContext();

    const onHandleBarsCompileMessage = (templateMessage: string, templateVariables: TemplateVariable[]) => {
        let example_vars = {
            agent: {
                name: loggedUser.name || 'Maria',
            },
            conversation: {
                iid: '#1234',
                createdAt: moment().format('DD/MM/YYYY'),
            },
            user: {
                name: 'João',
                phone: '(48)999887766',
            },
        };
        let template_vars: any = {};

        const variables: { [key: string]: number } = {};
        templateMessage.match(/{{(.*?)}}/g)?.forEach((string, index) => {
            let variable = string.replace(/{{/g, '');
            variable = variable.replace(/}}/g, '');
            const exist = templateVariables?.find((currVar) => currVar.value === variable);
            const isDefault = !!defaultVariablesTemplate.find((curr) => curr === variable);

            if (!variables[variable]) {
                const pos = Object.keys(variables)?.length + 1;
                variables[variable] = pos;
                set(template_vars, variable, '{{' + pos + '}}');

                if (!isDefault && exist) {
                    example_vars[variable] = exist?.sampleValue || 'EXAMPLE';
                } else if (!isDefault && !exist?.sampleValue) {
                    example_vars[variable] = 'EXAMPLE';
                }
            }
        });

        const te = Handlebars.compile(templateMessage);
        let example_message = te(example_vars);

        return {
            example_message,
        };
    };

    const renderFile = () => {
        if (!file) {
            return;
        }
        if (file.type?.startsWith('image')) {
            return (
                <div
                    style={{
                        backgroundImage: `url(${file.url})`,
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'cover',
                        width: '100%',
                        height: '110px',
                        borderRadius: '8px',
                    }}
                />
            );
        }
        if (file.type?.startsWith('video')) {
            return <ReactPlayerDiv key={file.type} url={file.url} controls={false} width='100%' height='110px' />;
        }
        return (
            <div style={{ display: 'flex', padding: '5px', background: '#ffce6654', width: '100%' }}>
                <IconFile />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className='text' title={file?.name}>
                        {file?.name}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{formatBytes(file.size || 0)}</span>
                </div>
            </div>
        );
    };

    const { example_message } = onHandleBarsCompileMessage(message, variables || []);
    return (
        <Div>
            <Balloon>
                {file ? <ContentFile>{renderFile()}</ContentFile> : null}
                {parseMarkDown(getWhatsAppFormatting(example_message, { href: true }))}

                {buttons && buttons.length > 0 && footerMessage && (
                    <div
                        style={{
                            fontSize: '12px',
                            color: '#82898c',
                            marginTop: '6px',
                            fontStyle: 'italic',
                        }}
                    >
                        {footerMessage}
                    </div>
                )}

                <ActivityTimestamp>{moment().format('HH:mm')}</ActivityTimestamp>
            </Balloon>
            {buttons && buttons.length ? (
                <ContentButtons>
                    {buttons.map((button, index) => {
                        if (buttons.length > 3 && index === buttons.length - 1) {
                            return (
                                <ButtonWhats flex={'1 1 100%'}>
                                    <TfiMenuAlt style={{ marginRight: 5 }} />
                                    {getTranslation('Open all options')}
                                </ButtonWhats>
                            );
                        }
                        if (index > 1 && buttons.length > 3) {
                            return null;
                        }
                        return (
                            <>
                                <ButtonWhats flex={'1 1 100%'}>
                                    {button.type === TemplateButtonType.QUICK_REPLY ? (
                                        <MdOutlineReply style={{ marginRight: 5 }} />
                                    ) : (
                                        <BiLinkExternal style={{ marginRight: 5 }} />
                                    )}
                                    {button.text}
                                </ButtonWhats>
                                {index !== buttons.length - 1 ? (
                                    <Divider style={{ margin: 0, width: '95%', borderColor: '#e5e5eaeb' }} />
                                ) : null}
                            </>
                        );
                    })}
                </ContentButtons>
            ) : null}
        </Div>
    );
};

export default ActivityPreview;
