import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { PreviewCoveredProps } from './interfaces';
import { IframeContainer, PreviewIframe } from './styles';

export const PreviewCovered = ({ iframeUrl, selectedFlow }: PreviewCoveredProps) => {
  const { t } = useTranslation();
  const whatsAppFlowLocaleKeys = localeKeys.settings.whatsAppFlow.components.preview;

  if (!iframeUrl || selectedFlow === undefined) {
    return (
      <IframeContainer>
        <PreviewIframe src={iframeUrl} title={t(whatsAppFlowLocaleKeys.iframeTitle)} />
      </IframeContainer>
    );
  }

  const payloadObject = selectedFlow
    ? {
        screen: selectedFlow.flowsData?.[0]?.flowScreen,
        data: selectedFlow.flowsData?.[0]?.data,
      }
    : {};

  const jsonString = JSON.stringify(payloadObject);
  const encodedPayload = encodeURIComponent(jsonString);
  const newUrl = new URL(iframeUrl);

  newUrl.searchParams.set('interactive', 'true');
  newUrl.searchParams.set('flow_action', 'navigate');
  newUrl.searchParams.set('flow_action_payload', encodedPayload);

  const finalIframeSrc = newUrl.toString();

  return (
    <IframeContainer>
      <PreviewIframe src={finalIframeSrc} title={t(whatsAppFlowLocaleKeys.iframeTitle)} />
    </IframeContainer>
  );
};
