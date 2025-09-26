import React, { FC, useState, useEffect, Suspense, useRef } from 'react';
import { ModalPosition } from '../../../../shared/Modal/ModalProps';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { PreviewImageProps } from './props';
import i18n from '../../../i18n/components/i18n';
import { Miniature, PreviewAttachments, CropArea, Content, ContentView } from './styled';
import { FileAttachment, Identity } from '../../interfaces/conversation.interface';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { Modal } from '../../../../shared/Modal/Modal';
import CropImage from './components/cropImage';
import Header from './components/header';
import { useSelector } from 'react-redux';
import { AttachmentService } from '../../service/Atttachment.service';
import { addNotification } from '../../../../utils/AddNotification';
import { LoadingArea, Spin } from '../../../../shared/Spin/spin';
import { dispatchWindowEvent } from '../../../../hooks/event.hook';
import PatientAppointmentsDocumentUpload from '../PatientAppointmentsDocumentUpload/PatientAppointmentsDocumentUpload';
import { DocumentService, DocumentStatusResponse } from '../../service/DocumentService';


const ModalIntegration = React.lazy(() => import('./components/modalIntegration'));
const PdfPreviewModal = React.lazy(() => import('./components/PdfPreviewModal'));

const PreviewImage: FC<PreviewImageProps & I18nProps> = (props) => {
    const { modalImage, closeModal, conversation } = props;

    const { fileAttachments } = conversation;
    const { opened, fileAttachment } = modalImage;
    const initialFileAttachment = (fileAttachment as FileAttachment) || fileAttachments?.[0];

    const [currentFileAttachment, setCurrentFileAttachment] = useState<FileAttachment>(initialFileAttachment);
    const [validFileAttachments, setValidFileAttachments] = useState<FileAttachment[]>([]);
    const [from, setFrom] = useState<Identity | undefined>(undefined);

    const name = currentFileAttachment.name.substr(0, currentFileAttachment.name.lastIndexOf('.'));
    const src = AttachmentService.createAttachmentUrl(conversation._id, currentFileAttachment?._id as string);

    const savedSettings = JSON.parse(localStorage.getItem('imageSettings') || '{}');
    const imageSettings = savedSettings[name];

    const [rotation, setRotation] = useState(imageSettings?.rotation || 0);
    const [crop, setCrop] = useState(imageSettings?.crop || { x: 0, y: 0 });
    const [zoom, setZoom] = useState<number>(imageSettings?.zoom || 1);
    const [cropping, setCropping] = useState(false);
    const [showIntegration, setShowIntegration] = useState(false);
    const [showDocumentUpload, setShowDocumentUpload] = useState(false);
    const [showPdfNotification, setShowPdfNotification] = useState(false);
    const [showPdfPopover, setShowPdfPopover] = useState(false);
    const [documentStatus, setDocumentStatus] = useState<DocumentStatusResponse | null>(null);
    const [loadingDocumentStatus, setLoadingDocumentStatus] = useState(false);

    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const { loggedUser } = useSelector((state: any) => state.loginReducer);

    const propsRef: any = useRef(null);
    propsRef.current = { src, rotation, name, crop, zoom };

    useEffect(() => {
        const savedSettings = JSON.parse(localStorage.getItem('imageSettings') || '{}');
        const updatedSettings = {
            ...savedSettings,
            [name]: {
                src,
                crop,
                zoom,
                rotation,
            },
        };
        localStorage.setItem('imageSettings', JSON.stringify(updatedSettings));
    }, [crop, zoom, name, src, rotation]);

    useEffect(() => {
        const imageSettings = savedSettings[name];

        if (imageSettings && imageSettings.src === src) {
            setRotation(imageSettings.rotation);
            setCrop(imageSettings.crop);
            setZoom(imageSettings.zoom);
        } else {
            setRotation(0);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src, name]);

    useEffect(() => {
        setValidFileAttachments(
            fileAttachments?.filter((fileAttachment) => AttachmentService.isPreviewableFile(fileAttachment.mimeType)) || []
        );
    }, [fileAttachments]);

    // Verificar status dos documentos apenas quando modal abre
    useEffect(() => {
        if (opened && selectedWorkspace) {
            checkDocumentStatus();
        }
    }, [opened, selectedWorkspace]);

    // Controlar notificação PDF e pausar áudio quando modal abre ou imagem muda
    useEffect(() => {
        if (opened) {
            dispatchWindowEvent('pauseCurrentAudio', null);
            
            // Verificar se deve mostrar notificação sobre mudança de comportamento do PDF
            if (AttachmentService.isPdfFile(currentFileAttachment.mimeType) && loggedUser?._id) {
                const popoverKey = `pdf_popover_notification_${loggedUser._id}`;
                const hasSeenPopover = localStorage.getItem(popoverKey);
                
                // Verificar se ainda está dentro do período de exibição (até 08/09/2025)
                const expirationDate = new Date('2025-09-08');
                const currentDate = new Date();
                
                if (!hasSeenPopover && currentDate <= expirationDate) {
                    // Mostrar popover após um pequeno delay para dar tempo do modal abrir
                    setTimeout(() => {
                        setShowPdfPopover(true);
                    }, 500);
                }
            }
        }
    }, [opened, currentFileAttachment.mimeType, loggedUser?._id]);

    useEffect(() => {
        const member = conversation.members?.find((member) => member.id === currentFileAttachment.memberId);
        !!member && setFrom(member);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFileAttachment]);

    useEffect(() => {
        const scrollArea = document.getElementById('scroll-area');
        scrollArea &&
            (scrollArea.onclick = (e) => {
                const x = e.pageX - scrollArea.offsetLeft;
                const distance = 120;

                if (x > scrollArea.offsetWidth - distance) {
                    scrollArea.scrollLeft += distance;
                } else if (x < distance) {
                    scrollArea.scrollLeft -= distance;
                }
            });

        handleScape();
    }, []);

    const handleScape = () => {
        document.onkeydown = (evt: any) => {
            evt = evt || window.event;
            let isEscape = false;

            if ('key' in evt) isEscape = evt.key === 'Escape' || evt.key === 'Esc';
            else isEscape = evt.keyCode === 27;

            if (isEscape) {
                closeModal();
            }
        };
    };

    useEffect(() => {
        const handleKey = (event: KeyboardEvent) => {
            const keyCode = event.keyCode;

            if (keyCode === 37) {
                const currentIndex = validFileAttachments.findIndex(
                    (attachment) => attachment._id === currentFileAttachment._id
                );
                if (currentIndex > 0) {
                    const previousAttachment = validFileAttachments[currentIndex - 1];
                    handleCurrentFileAttachment(previousAttachment);
                }
            } else if (keyCode === 39) {
                const currentIndex = validFileAttachments.findIndex(
                    (attachment) => attachment._id === currentFileAttachment._id
                );
                if (currentIndex < validFileAttachments.length - 1) {
                    const nextAttachment = validFileAttachments[currentIndex + 1];
                    handleCurrentFileAttachment(nextAttachment);
                }
            }
        };
        window.addEventListener('keyup', handleKey, false);
        return () => {
            window.removeEventListener('keyup', handleKey, false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFileAttachment, validFileAttachments]);

    const handleCurrentFileAttachment = (fileAttachment: FileAttachment) => {
        if (imageSettings && imageSettings.src === src) {
            setRotation(imageSettings.rotation);
            setCrop(imageSettings.crop);
            setZoom(imageSettings.zoom);
        } else {
            setRotation(0);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
        }
        setCurrentFileAttachment(fileAttachment);
    };

    const rotate = () => {
        if (rotation >= 270) {
            setRotation(0);
        } else {
            setRotation((prevState: number) => prevState + 90);
        }
    };

    const handlePdfNotificationOk = () => {
        if (loggedUser?._id) {
            const notificationKey = `pdf_behavior_notification_${loggedUser._id}`;
            localStorage.setItem(notificationKey, 'true');
        }
        setShowPdfNotification(false);
    };

    const handleClosePdfPopover = () => {
        if (loggedUser?._id) {
            const popoverKey = `pdf_popover_notification_${loggedUser._id}`;
            localStorage.setItem(popoverKey, 'true');
        }
        setShowPdfPopover(false);
    };

    const checkDocumentStatus = async () => {
        if (!selectedWorkspace) return;
        
        setLoadingDocumentStatus(true);
        try {
            const status = await DocumentService.checkDocumentStatus(selectedWorkspace._id);
            setDocumentStatus(status);
        } catch (error) {
            // Em caso de erro, verifica se contém informações específicas da API
            const errorData = error.response?.data;
            if (errorData) {
                setDocumentStatus({
                    ok: false,
                    message: errorData.message || 'Document upload is currently unavailable',
                    code: errorData.code
                });
            }
        } finally {
            setLoadingDocumentStatus(false);
        }
    };

    return (
        <Modal
            height='100%'
            width='100%'
            className='viewImagePreview'
            isOpened={opened}
            position={ModalPosition.center}
        >
            {modalImage && (
                <Content>
                    <Header
                        from={from}
                        conversationId={conversation._id}
                        onRotate={rotate}
                        onClose={() => closeModal(true)}
                        attachment={currentFileAttachment}
                        showIntegration={showIntegration}
                        onCropping={() => setCropping(!cropping)}
                        onShowIntegration={() => setShowIntegration(!showIntegration)}
                        onShowDocumentUpload={documentStatus?.ok === true ? () => setShowDocumentUpload(!showDocumentUpload) : undefined}
                        loggedUser={loggedUser}
                        showPdfPopover={showPdfPopover && AttachmentService.isPdfFile(currentFileAttachment.mimeType)}
                        onClosePdfPopover={handleClosePdfPopover}
                        documentStatus={documentStatus}
                        loadingDocumentStatus={loadingDocumentStatus}
                    />
                    <ContentView>
                        <CropArea showDocumentUpload={showDocumentUpload}>
                            {AttachmentService.isPdfFile(currentFileAttachment.mimeType) ? (
                                <Suspense
                                    fallback={
                                        <LoadingArea>
                                            <Spin />
                                        </LoadingArea>
                                    }
                                >
                                    <PdfPreviewModal fileUrl={src} />
                                </Suspense>
                            ) : (
                                <CropImage
                                    crop={crop}
                                    setCrop={(newCrop) => setCrop(newCrop)}
                                    setZoom={(newZoom) => setZoom(newZoom)}
                                    zoom={zoom}
                                    name={name}
                                    extension={currentFileAttachment.name.split('.').pop() as string}
                                    cropping={cropping}
                                    onCancel={() => setShowIntegration(false)}
                                    rotation={rotation}
                                    src={src}
                                />
                            )}
                        </CropArea>
                        {showIntegration && selectedWorkspace && (
                            <Suspense
                                fallback={
                                    <LoadingArea>
                                        <Spin />
                                    </LoadingArea>
                                }
                            >
                                <ModalIntegration
                                    addNotification={addNotification}
                                    conversation={conversation}
                                    cropping={cropping}
                                    workspaceId={selectedWorkspace._id}
                                    attachmentId={currentFileAttachment._id as string}
                                />
                            </Suspense>
                        )}
                        {showDocumentUpload && (
                            <PatientAppointmentsDocumentUpload
                                isOpen={showDocumentUpload}
                                onClose={() => {
                                    setShowDocumentUpload(false);
                                }}
                                patientId={(() => {
                                    const patientId = conversation.attributes?.find(attr => attr.type === '@sys.patientId')?.value || '';
                                    return patientId;
                                })()}
                                patientCode={(() => {
                                    const patientCode = conversation.attributes?.find(attr => attr.type === '@sys.patientCode')?.value || conversation.attributes?.find(attr => attr.type === '@sys.cpf')?.value || '';
                                    return patientCode;
                                })()}
                                conversationId={conversation._id}
                                currentImageAttachment={currentFileAttachment}
                                imageUrl={src}
                                conversationAttributes={conversation.attributes}
                                initialDocumentStatus={documentStatus}
                            />
                        )}
                    </ContentView>
                    <PreviewAttachments id='scroll-area'>
                        {validFileAttachments?.map((fileAttachment) => {
                            const attachmentUrl = AttachmentService.createAttachmentUrl(
                                conversation._id,
                                fileAttachment?._id as string
                            );

                            return (
                                <Wrapper key={`attachment:${fileAttachment._id}`} margin='0 7px 0 0' width='90px'>
                                    {AttachmentService.isPdfFile(fileAttachment.mimeType) ? (
                                        <div
                                            onClick={() => handleCurrentFileAttachment(fileAttachment)}
                                            style={{
                                                width: '90px',
                                                height: '90px',
                                                minWidth: '90px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: currentFileAttachment._id === fileAttachment._id ? '#f8d7da' : '#ffffff',
                                                border: '4px solid #e0e0e0',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                transform: currentFileAttachment._id === fileAttachment._id ? 'scale(0.80)' : 'scale(1)',
                                                color: currentFileAttachment._id === fileAttachment._id ? '#721c24' : '#333'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (currentFileAttachment._id !== fileAttachment._id) {
                                                    e.currentTarget.style.outline = '5px solid #e0e0e0';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.outline = 'none';
                                            }}
                                        >
                                            <svg 
                                                width="24" 
                                                height="24" 
                                                viewBox="0 0 24 24" 
                                                fill="currentColor"
                                                style={{ marginBottom: '4px' }}
                                            >
                                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                            </svg>
                                            <span style={{ 
                                                fontSize: '10px', 
                                                fontWeight: '600',
                                                color: currentFileAttachment._id === fileAttachment._id ? '#721c24' : '#333'
                                            }}>PDF</span>
                                        </div>
                                    ) : (
                                        <Miniature
                                            onClick={() => handleCurrentFileAttachment(fileAttachment)}
                                            src={attachmentUrl}
                                            selected={currentFileAttachment._id === fileAttachment._id}
                                        />
                                    )}
                                </Wrapper>
                            );
                        })}
                    </PreviewAttachments>
                </Content>
            )}
        </Modal>
    );
};

export default i18n(PreviewImage) as FC<PreviewImageProps>;
