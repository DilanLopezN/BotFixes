import { Modal, Spin } from 'antd';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '~/hooks/use-auth';
import { AppTypePort, getBaseUrl } from '~/utils/redirect-app';
import type { ConversationPreviewModalProps } from './interfaces';
import { Iframe } from './styles';

export const ConversationPreviewModal = ({
  conversationId,
  isVisible,
  onClose,
}: ConversationPreviewModalProps) => {
  const { workspaceId } = useParams<{
    workspaceId: string;
  }>();
  const { user } = useAuth();
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  const liveAgentpath = getBaseUrl({
    pathname: '/iframes',
    appTypePort: AppTypePort.APP,
    queryString: `?workspaceId=${workspaceId}&conversationId=${conversationId}&userId=${user?._id}`,
    addExtraQueries: false,
  });

  return (
    <Modal
      title='Visualização da conversa'
      open={isVisible}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Spin spinning={isIframeLoading}>
        <Iframe
          title='Live Agent'
          src={liveAgentpath}
          onLoad={() => {
            setIsIframeLoading(false);
          }}
        />
      </Spin>
    </Modal>
  );
};
