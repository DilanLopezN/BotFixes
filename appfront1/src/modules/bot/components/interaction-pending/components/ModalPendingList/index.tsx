import { FC } from 'react';
import { InteractionPendingProps } from '../..';
import { Content, ModalStyled, ViewIcon } from './styled';
import { Button, Col, Divider } from 'antd';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { BotActions } from '../../../../redux/actions';
import I18n from '../../../../../i18n/components/i18n';

interface InteractionPendingListProps {
    interactionsPending: InteractionPendingProps[];
    open: boolean;
    close: () => void;
    setUnchangedInteraction: any;
    setCurrentInteraction: any;
    setValidateInteraction: any;
}

const ModalPendingList: FC<InteractionPendingListProps> = ({
    interactionsPending,
    open,
    close,
    setUnchangedInteraction,
    setCurrentInteraction,
    setValidateInteraction,
}) => {
    const onSetCurrentInteraction = (value: InteractionPendingProps) => {
        if (value.interactionOldVersion) {
            setUnchangedInteraction(value.interactionOldVersion);
        }
        setCurrentInteraction(value.interactionNewVersion);
        setValidateInteraction(value.interactionNewVersion);
        close();
    };
    return (
        <ModalStyled
            title={'Lista de interações pendentes de publicação'}
            open={open}
            onCancel={close}
            width={700}
            footer={null}
            destroyOnClose
            bodyStyle={{
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                overflowY: 'auto',
                maxHeight: '500px',
            }}
        >
            <>
                {interactionsPending.map((pending, index) => {
                    return (
                        <Content key={pending._id}>
                            <Col
                                style={{
                                    width: '70%',
                                }}
                                title={pending.name}
                            >
                                <div style={{ display: 'flex' }}>
                                    {!pending?.interactionOldVersion && (
                                        <div style={{ color: 'blue', marginRight: '5px', width: '110px' }}>
                                            (Interação nova)
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            width: '340px',
                                        }}
                                    >
                                        {pending.name}
                                    </div>
                                </div>
                            </Col>
                            <Col>
                                <Button
                                    icon={<ViewIcon />}
                                    className='antd-span-default-color'
                                    onClick={() => {
                                        onSetCurrentInteraction(pending);
                                    }}
                                >
                                    Visualizar alterações
                                </Button>
                            </Col>
                            {index !== interactionsPending.length - 1 && <Divider style={{ margin: '8px 0 0 0' }} />}
                        </Content>
                    );
                })}
            </>
        </ModalStyled>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({});

export default I18n(
    withRouter(
        connect(mapStateToProps, {
            setUnchangedInteraction: BotActions.setUnchangedInteraction,
            setCurrentInteraction: BotActions.setCurrentInteraction,
            setValidateInteraction: BotActions.setValidateInteraction,
        })(ModalPendingList)
    )
);
