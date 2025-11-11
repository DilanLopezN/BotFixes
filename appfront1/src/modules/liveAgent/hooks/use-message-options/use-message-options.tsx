import { MenuProps, message, Space } from 'antd';
import { FaReply, FaSmile } from 'react-icons/fa';
import { MdFileDownload } from 'react-icons/md';
import { PiStarFourFill } from 'react-icons/pi';
import { CopyOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { useLanguageContext } from '../../../i18n/context';
import { downloadAudio } from '../../components/AudioPlayer/components/player/download-audio';
import { UseAudioOptionsProps } from './interfaces';

const AIicon = styled(PiStarFourFill)`
    font-size: 1rem;
    margin: 0 3px 0 -3px;
`;

export const useMessageOptions = ({
    audioUrl,
    data,
    handleReact,
    handleReply,
    isAudioPlayer,
    canReaction,
    audioTranscription,
    getAudioTranscription,
    activityText,
}: UseAudioOptionsProps) => {
    const { getTranslation } = useLanguageContext();
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);

    const handleCopyMessage = async () => {
        if (!activityText) {
            message.warning(getTranslation('No text to copy'));
            return;
        }

        try {
            await navigator.clipboard.writeText(activityText);
            message.success(getTranslation('Message copied!'));
        } catch (err) {
            // Fallback para navegadores antigos
            const textArea = document.createElement('textarea');
            textArea.value = activityText;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                message.success(getTranslation('Message copied!'));
            } catch (err) {
                message.error(getTranslation('Failed to copy'));
            }
            document.body.removeChild(textArea);
        }
    };

    const options: MenuProps['items'] = [];

    if (
        !!selectedWorkspace?.featureFlag?.enableAudioTranscription &&
        !audioTranscription &&
        !!data?.clientMessage &&
        isAudioPlayer
    ) {
        options.push({
            key: '3',
            label: (
                <Space title={getTranslation('Powered by AI')}>
                    <AIicon />
                    {getTranslation('Convert to text')}
                </Space>
            ),
            onClick: () => getAudioTranscription?.(),
        });
    }

    if (canReaction) {
        options.push({
            key: '1',
            label: (
                <Space title={getTranslation('Reagir')}>
                    <FaSmile />
                    {getTranslation('Reagir')}
                </Space>
            ),
            onClick: handleReact,
        });
    }

    if (canReaction) {
        options.push({
            key: '2',
            label: (
                <Space title={getTranslation('Respond')}>
                    <FaReply />
                    {getTranslation('Respond')}
                </Space>
            ),
            onClick: handleReply,
        });
    }

    if (activityText) {
        options.push({
            key: '5',
            label: (
                <Space title={getTranslation('Copy message')}>
                    <CopyOutlined />
                    {getTranslation('Copy message')}
                </Space>
            ),
            onClick: handleCopyMessage,
        });
    }

    if (isAudioPlayer) {
        options.push({
            key: '4',
            label: (
                <Space title={getTranslation('Download audio')}>
                    <MdFileDownload />
                    {getTranslation('Download audio')}
                </Space>
            ),
            onClick: () => downloadAudio(audioUrl || ''),
        });
    }

    return { options };
};
