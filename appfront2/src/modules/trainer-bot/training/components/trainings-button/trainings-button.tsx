import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, message, Modal, Space } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { useDoTraining } from '../../hooks/use-do-training';
import { TrainingButtonProps } from './interfaces';

export const TrainingButton = ({ trainings, setTrainings }: TrainingButtonProps) => {
  const { t } = useTranslation();
  const { trainingButtons: trainingButtonsLocaleKeys } = localeKeys.trainerBot.training.components;
  const isPending = trainings.some((t) => t.pendingTraining);
  const { startTraining, isLoading: isTrainingLoading } = useDoTraining();

  const getButtonIcon = () => {
    if (isTrainingLoading) return <LoadingOutlined />;
    if (!isPending) return <CheckCircleOutlined />;
    return null;
  };

  const getButtonText = () => {
    if (isTrainingLoading) return t(trainingButtonsLocaleKeys.trainingInProgress);
    if (isPending) return t(trainingButtonsLocaleKeys.trainAll);
    return t(trainingButtonsLocaleKeys.allTrained);
  };

  const handleTrain = () => {
    Modal.confirm({
      title: t(trainingButtonsLocaleKeys.confirmTrainingTitle),
      onOk: async () => {
        const trainingDto = { forceAll: true };
        try {
          await startTraining(trainingDto);
          setTrainings((prev) =>
            prev.map((item) => ({
              ...item,
              pendingTraining: false,
              executedTrainingAt: dayjs().toISOString(),
            }))
          );
          message.success(t(trainingButtonsLocaleKeys.successTrainingMessage));
        } catch (err) {
          message.error(t(trainingButtonsLocaleKeys.errorTrainingMessage));
        }
      },
    });
  };

  const buttonIcon = getButtonIcon();
  const buttonText = getButtonText();

  return (
    <Space style={{ marginBottom: 16 }}>
      <Button onClick={handleTrain} icon={buttonIcon} disabled={isTrainingLoading}>
        {buttonText}
      </Button>
    </Space>
  );
};
