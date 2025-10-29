import { CloseOutlined } from '@ant-design/icons';
import { Col, Row } from 'antd';
import { FC, useEffect, useRef } from 'react';
import { dispatchWindowEvent } from '../../../../hooks/event.hook';
import { timeout } from '../../../../utils/Timer';
import ActivityQuoted from '../ActivityQuoted';
import { TextAreaAutoSizeProps } from './props';
import { StyledDiv, TextareaMessage } from './styled';

const TextAreaAutoSize: FC<TextAreaAutoSizeProps> = ({
    isFocusOnReply,
    messageToReply,
    replayActivity,
    scrollToActivity,
    isReplying,
    setIsReplying,
    ...props
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const autosize = () => {
        timeout(() => {
            if (!textareaRef || !textareaRef.current) return;

            textareaRef.current.style.cssText = 'height:auto;';
            textareaRef.current.style.cssText = 'height:' + textareaRef.current.scrollHeight + 'px';
        }, 0);
    };
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.addEventListener('keydown', autosize);
        }
        return () => {
            if (textarea) {
                textarea.removeEventListener('keydown', autosize);
            }
        };
    }, []);

    const closeReplyBox = () => {
        if (setIsReplying) {
            setIsReplying(false);
            dispatchWindowEvent('setIsFocusOnReplyEvent', { onFocus: false });
        }
    };

    useEffect(() => {
        if (isFocusOnReply && textareaRef.current && setIsReplying) {
            setIsReplying(true);
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 0);
        }
    }, [isFocusOnReply, setIsReplying]);

    return (
        <div>
            {isReplying && (
                <StyledDiv>
                    <Row align={'middle'}>
                        <Col span={23}>
                            {replayActivity && scrollToActivity && (
                                <ActivityQuoted activity={replayActivity} scrollToActivity={scrollToActivity} />
                            )}
                        </Col>
                        <Col span={1}>
                            <CloseOutlined size={24} onClick={closeReplyBox} title='Excluir' />
                        </Col>
                    </Row>
                </StyledDiv>
            )}
            <TextareaMessage ref={textareaRef} {...props} />
        </div>
    );
};

export default TextAreaAutoSize;
