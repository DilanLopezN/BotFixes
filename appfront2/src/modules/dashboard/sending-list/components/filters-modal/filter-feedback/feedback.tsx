import React from 'react';
import { Radio, Space } from 'antd';
import type { RadioChangeEvent } from 'antd';
import type { FeedbackProps } from './feedback-interface';
import { feedbackEnum } from '../constants';

const feedbackOptions: { value: feedbackEnum | null; label: string }[] = [
  { value: null, label: 'Todos' },
  { value: feedbackEnum.withFeedback, label: 'Com feedback' },
  { value: feedbackEnum.noFeedback, label: 'Sem feedback' },
];

export const Feedback: React.FC<FeedbackProps> = ({ feedback = null, setFeedback }) => {
  const onChange = (e: RadioChangeEvent) => {
    setFeedback(e.target.value);
  };

  return (
    <div>
      <Radio.Group onChange={onChange} value={feedback}>
        <Space direction='vertical'>
          {feedbackOptions.map((option) => (
            <Radio key={option.value === null ? 'all' : option.value} value={option.value}>
              {option.label}
            </Radio>
          ))}
        </Space>
      </Radio.Group>
    </div>
  );
};
