import dayjs from 'dayjs';
import { BiLinkExternal } from 'react-icons/bi';
import { MdOutlineReply } from 'react-icons/md';
import { Divider } from 'antd';
import { TemplateButtonType } from '~/constants/template-button-type';
import { TemplateVariable } from '~/interfaces/template-message';
import { adaptWhatsAppFormatting } from '~/utils/adapt-whats-app-formatting';
import { formatBytes } from '~/utils/format-bytes';
import { defaultVariablesTemplate } from '../../constants';
import { MarkdownViewer } from '../markdown-viewer';
import { ActivityPreviewProps, ExampleVarsBase } from './interface';
import {
  ActivityTimestamp,
  Balloon,
  ButtonWhats,
  ContentButtons,
  ContentFile,
  Div,
  IconFile,
  ReactPlayerDiv,
} from './styles';

export const ActivityPreview = ({ message, buttons, variables, file }: ActivityPreviewProps) => {
  const compileMessage = (templateMessage: string, templateVariables: TemplateVariable[]) => {
    const exampleVars: ExampleVarsBase = {
      agent: { name: 'Maria' },
      conversation: { iid: '#1234', createdAt: dayjs().format('DD/MM/YYYY') },
      user: { name: 'João', phone: '(48)999887766' },
    };
    const templateVars: Record<string, string> = {};
    const variablesMap: { [key: string]: number } = {};
    templateMessage.match(/{{(.*?)}}/g)?.forEach((match) => {
      const variable = match.replace(/{{/g, '').replace(/}}/g, '');
      const exists = templateVariables?.find((currVar) => currVar.value === variable);
      const isDefault = Object.values(defaultVariablesTemplate).includes(variable);
      if (!variablesMap[variable]) {
        const pos = Object.keys(variablesMap).length + 1;
        variablesMap[variable] = pos;
        templateVars[variable] = `{{${pos}}}`;
        if (!isDefault && exists) {
          exampleVars[variable] = exists.sampleValue || 'EXAMPLE';
        } else if (!isDefault && !exists?.sampleValue) {
          exampleVars[variable] = 'EXAMPLE';
        }
      }
    });
    let exampleMessage = templateMessage;
    Object.keys(templateVars).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      exampleMessage = exampleMessage.replace(regex, exampleVars[key]);
    });
    return { exampleMessage };
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
      return (
        <ReactPlayerDiv
          key={file.type}
          url={file.url}
          controls={false}
          width='100%'
          height='110px'
        />
      );
    }
    return (
      <div style={{ display: 'flex', padding: '5px', background: '#ffce6654', width: '100%' }}>
        <IconFile />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className='text' title={file?.name}>
            {file?.name}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>
            {formatBytes(file.size || 0)}
          </span>
        </div>
      </div>
    );
  };

  const { exampleMessage } = compileMessage(message, variables || []);

  const formattedText = adaptWhatsAppFormatting(exampleMessage);

  return (
    <Div>
      <Balloon>
        {file ? <ContentFile>{renderFile()}</ContentFile> : null}
        <MarkdownViewer>{formattedText}</MarkdownViewer>
        <ActivityTimestamp>{dayjs().format('HH:mm')}</ActivityTimestamp>{' '}
      </Balloon>
      {buttons && buttons.length ? (
        <ContentButtons>
          {buttons.map((button, index) => (
            <>
              <ButtonWhats flex='1 1 100%'>
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
          ))}
        </ContentButtons>
      ) : null}
    </Div>
  );
};
