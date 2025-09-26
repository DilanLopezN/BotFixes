import React, { Component } from 'react';
import './ModalConfirm.scss';
import { ModalConfirmProps } from './ModalConfirmProps';
import I18n from '../../modules/i18n/components/i18n';
import { Button, Modal } from 'antd';

class ModalConfirmClass extends Component<ModalConfirmProps> {
    render(): React.ReactNode {
        const { getTranslation, isOpened, onAction, onCancelText, onConfirmText } = this.props;

        const handleCancel = () => {
            onAction(false);
        };

        const handleDelete = () => {
            onAction(true);
        };
        return (
            <div className='ModalDeleteItem'>
                <Modal
                    style={{
                        minWidth: '400px',
                        maxWidth: '280px',
                    }}
                    open={isOpened}
                    onCancel={handleCancel}
                    footer={[
                        <Button className='antd-span-default-color' type='link' key='cancel' onClick={handleCancel}>
                            {onCancelText || getTranslation('Cancel')}
                        </Button>,
                        <Button
                            className='antd-span-default-color'
                            key='delete'
                            type='primary'
                            danger
                            onClick={handleDelete}
                        >
                            {onConfirmText || getTranslation('Delete')}
                        </Button>,
                    ]}
                >
                    <div className='modal-delete-item'>{this.props.children}</div>
                </Modal>
            </div>
        );
    }
}

export const ModalConfirm = I18n(ModalConfirmClass);
