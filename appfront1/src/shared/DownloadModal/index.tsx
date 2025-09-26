import { Button, Divider, Popover, Radio, Row } from 'antd';
import { FC, useState } from 'react';
import { IoMdArrowDropdown } from 'react-icons/io';
import i18n from '../../modules/i18n/components/i18n';
import { I18nProps } from '../../modules/i18n/interface/i18n.interface';
import { DownloadModalProps } from './props';

const DownloadModal: React.FC<DownloadModalProps & I18nProps> = (props) => {
    const { onDownload, getTranslation, isDownloadDisabled, type, isNotClosed } = props;

    const [downloadType, setDownloadType] = useState<string>('XLSX');
    const [popoverVisible, setPopoverVisible] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleOptionChange = (e: any) => {
        e.stopPropagation();
        setDownloadType(e.target.value);
    };

    const handleCancel = () => {
        setDownloadType('');
        setPopoverVisible(false);
    };

    const handleDownload = async () => {
        if (downloadType) {
            setIsDownloading(true);
            await onDownload(downloadType);
            setIsDownloading(false);
        }
        setPopoverVisible(false);
    };

    const openPopover = () => {
        setPopoverVisible(true);
    };

    const content = (
        <Radio.Group onChange={handleOptionChange} value={downloadType}>
            <Row style={{ marginTop: 10 }}>
                <Radio value='CSV'> {getTranslation('CSV')}</Radio>
            </Row>
            <Row style={{ marginTop: 10 }}>
                <Radio value='XLSX'> {getTranslation('XLSX (Excel)')}</Radio>
            </Row>
            <Divider />
            <Row>
                <Button className='antd-span-default-color' type='link' onClick={handleCancel} disabled={isDownloading}>
                    {getTranslation('Cancel')}
                </Button>
                <Button
                    style={{ borderRadius: '6px' }}
                    type='primary'
                    className='antd-span-default-color'
                    onClick={handleDownload}
                    disabled={!downloadType || isDownloadDisabled}
                    loading={isDownloading}
                >
                    {getTranslation('export')}
                </Button>
            </Row>
        </Radio.Group>
    );

    return (
        <>
            <Popover
                content={content}
                trigger='click'
                placement='bottomRight'
                open={popoverVisible || isDownloading}
                onOpenChange={(visible) => {
                    if (!isNotClosed) {
                        setPopoverVisible(visible);
                    }
                }}
            >
                <Button
                    disabled={!!isNotClosed}
                    className='antd-span-default-color'
                    onClick={openPopover}
                    type={type || 'default'}
                >
                    <div>
                        {getTranslation('export')}
                        <IoMdArrowDropdown />
                    </div>
                </Button>
            </Popover>
        </>
    );
};
export default i18n(DownloadModal) as FC<DownloadModalProps>;
