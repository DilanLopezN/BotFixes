import React, { FC, useEffect, useState, useCallback, useRef } from 'react';
import jwtDecode from 'jwt-decode';
import { useSelector } from 'react-redux';
import {
    DocumentService,
    DocumentType,
    AppointmentService,
    DocumentStatusResponse,
} from '../../service/DocumentService';
import { addNotification } from '../../../../utils/AddNotification';
import { Spin, LoadingArea } from '../../../../shared/Spin/spin';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import {
    SideModalContainer,
    Content,
    AppointmentsList,
    AppointmentCard,
    AppointmentInfo,
    DocumentTypeSelect,
    UploadButton,
    ManualInputSection,
    ManualInputContainer,
    PatientCodeInput,
    SearchButton,
    SectionTitle,
    UploadButtonContainer,
    UploadActionButton,
    UploadPopover,
    PopoverHeader,
    PopoverTitle,
    PopoverClose,
    PopoverContent,
    AppointmentSummary,
    PopoverActions,
    PopoverCancelButton,
    UseCurrentImageSection,
    UseCurrentImageButton,
    SelectedFileInfo,
    AppointmentsHeader,
    RefreshButton,
    BlockedSection,
    StatusLoadingSection,
    PatientNameDisplay,
} from './styled';

interface FileDocument {
    id: string;
    originalName: string;
    fileTypeCode: string;
    createdAt: string;
    externalId?: string;
}

interface Appointment {
    appointmentCode: string;
    appointmentDate: string;
    appointmentTypeCode: string;
    appointmentTypeName: string;
    doctorCode: string;
    doctorName: string;
    specialityCode: string;
    specialityName: string;
    procedureCode?: string;
    procedureName?: string;
    files?: FileDocument[];
}

interface PatientAppointmentsDocumentUploadProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientCode: string;
    conversationId: string;
    currentImageAttachment?: any;
    imageUrl?: string;
    conversationAttributes?: any[];
    initialDocumentStatus?: DocumentStatusResponse | null;
}

const PatientAppointmentsDocumentUpload: FC<PatientAppointmentsDocumentUploadProps & I18nProps> = ({
    isOpen,
    onClose,
    patientId,
    patientCode,
    conversationId,
    currentImageAttachment,
    imageUrl,
    conversationAttributes,
    initialDocumentStatus,
    getTranslation,
}) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [selectedFileAttachmentId, setSelectedFileAttachmentId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [manualPatientCode, setManualPatientCode] = useState<string>('');
    const [showManualInput, setShowManualInput] = useState(false);
    const [showUploadPopover, setShowUploadPopover] = useState(false);
    const [popoverAppointment, setPopoverAppointment] = useState<Appointment | null>(null);
    const [documentStatus, setDocumentStatus] = useState<DocumentStatusResponse | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [patientAuthToken, setPatientAuthToken] = useState<string>('');
    const [patientName, setPatientName] = useState<string>('');
    const [successButtonId, setSuccessButtonId] = useState<string>('');
    const [hasUserInteractedWithCpf, setHasUserInteractedWithCpf] = useState(false);

    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const cpfInputRef = useRef<HTMLInputElement>(null);

    // Função para decodificar o token e extrair o nome do paciente
    const decodeTokenAndSetPatientName = useCallback((token: string) => {
        try {
            const decoded: any = jwtDecode(token);
            if (decoded.patientName) {
                setPatientName(decoded.patientName);
            }
        } catch (error) {
            console.error('Error decoding token:', error);
            setPatientName('');
        }
    }, []);

    // Função para buscar CPF nos atributos da conversa
    const findCpfInAttributes = useCallback(() => {
        if (!conversationAttributes) return '';

        // Busca por atributos que contenham CPF (case insensitive)
        const cpfAttribute = conversationAttributes.find((attr) => attr.type && attr.type === '@sys.cpf');

        return cpfAttribute?.value || '';
    }, [conversationAttributes]);

    // Função para carregar status dos documentos após carregar agendamentos
    const loadDocumentStatusForAppointments = async (appointmentsData: Appointment[], authToken: string) => {
        if (!selectedWorkspace) return appointmentsData;

        const appointmentsWithFiles = [...appointmentsData];

        // Carrega documentos para cada agendamento
        for (let i = 0; i < appointmentsWithFiles.length; i++) {
            const appointment = appointmentsWithFiles[i];
            try {
                const documents = await DocumentService.listDocuments(selectedWorkspace._id, {
                    scheduleCode: appointment.appointmentCode,
                }, authToken);

                appointmentsWithFiles[i] = {
                    ...appointment,
                    files: Array.isArray(documents) ? documents.map((doc) => ({
                        id: doc.id,
                        originalName: doc.originalName,
                        fileTypeCode: doc.fileTypeCode,
                        createdAt: doc.createdAt,
                        externalId: doc.externalId,
                    })) : [],
                };
            } catch (error) {
                console.error(`Error loading documents for appointment ${appointment.appointmentCode}:`, error);
                // Mantém o agendamento sem arquivos em caso de erro
            }
        }

        return appointmentsWithFiles;
    };


    // Verifica se o usuário pode usar a funcionalidade de documentos
    const checkDocumentStatus = useCallback(async () => {
        if (!selectedWorkspace) return;

        setStatusLoading(true);

        try {
            const status = await DocumentService.checkDocumentStatus(selectedWorkspace._id);
            setDocumentStatus(status);

            if (!status.ok || !status.enabled) {
                setIsBlocked(true);

                let errorMessage = status.message;
                switch (status.code) {
                    case 'INTEGRATION_NOT_VALID':
                        errorMessage = getTranslation('Document upload feature is not available');
                        break;
                    case 'FEATURE_DISABLED':
                        errorMessage = getTranslation('Document upload feature is temporarily unavailable');
                        break;
                    case 'ERP_USERNAME_UNSETTLED':
                        errorMessage = 'Usuário do ERP não configurado. Entre em contato com a supervisão para configurar o usuário do ERP';
                        break;
                    default:
                        errorMessage = status.message || getTranslation('Document upload is currently unavailable');
                }

                addNotification({
                    type: 'danger',
                    message: errorMessage,
                });
            } else {
                setIsBlocked(false);
            }
        } catch (error) {
            console.error('Error checking document status:', error);
            
            // Verifica se o erro contém informações específicas da API
            const errorData = error.response?.data;
            let errorMessage = getTranslation('Failed to verify document upload permissions');

            if (errorData) {
                setDocumentStatus({
                    ok: false,
                    message: errorData.message || 'Document upload is currently unavailable',
                    code: errorData.code
                });

                // Trata mensagens específicas baseadas no código de erro
                switch (errorData.code) {
                    case 'ERP_USERNAME_UNSETTLED':
                        errorMessage = 'Usuário do ERP não configurado. Entre em contato com a supervisão para configurar o usuário do ERP';
                        break;
                    case 'INTEGRATION_NOT_VALID':
                        errorMessage = getTranslation('Document upload feature is not available');
                        break;
                    case 'FEATURE_DISABLED':
                        errorMessage = getTranslation('Document upload feature is temporarily unavailable');
                        break;
                    default:
                        errorMessage = errorData.message || getTranslation('Failed to verify document upload permissions');
                }
            }

            setIsBlocked(true);
            addNotification({
                type: 'danger',
                message: errorMessage,
            });
        } finally {
            setStatusLoading(false);
        }
    }, [selectedWorkspace, getTranslation]);

    // Carrega os tipos de documentos
    const loadDocumentTypes = useCallback(async () => {
        if (!selectedWorkspace || isBlocked) return;

        try {
            const types = await DocumentService.listDocumentTypes(selectedWorkspace._id, patientAuthToken);
            setDocumentTypes(types);
        } catch (error) {
            console.error('Error loading document types:', error);
            addNotification({
                type: 'danger',
                message: getTranslation('Failed to load document types'),
            });
        }
    }, [selectedWorkspace, getTranslation, isBlocked, patientAuthToken]);

    // Preenche automaticamente o CPF quando o modal abre e dá foco no input
    useEffect(() => {
        if (isOpen && showManualInput) {
            const cpfFromAttributes = findCpfInAttributes();
            if (cpfFromAttributes && !manualPatientCode && !hasUserInteractedWithCpf) {
                setManualPatientCode(cpfFromAttributes);
            }

            // Dá foco no input após um pequeno delay para garantir que o DOM foi renderizado
            setTimeout(() => {
                cpfInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, showManualInput, findCpfInAttributes]);

    useEffect(() => {
        if (isOpen) {
            // Se já temos o status inicial do modal de imagem, usar ele
            if (initialDocumentStatus) {
                setDocumentStatus(initialDocumentStatus);
                
                if (!initialDocumentStatus.ok || !initialDocumentStatus.enabled) {
                    setIsBlocked(true);
                } else {
                    setIsBlocked(false);
                }
            } else {
                // Senão, fazer a verificação
                checkDocumentStatus();
            }
        }
    }, [isOpen, initialDocumentStatus, checkDocumentStatus, patientId, patientCode, conversationId, selectedWorkspace]);

    useEffect(() => {
        if (isOpen && !isBlocked && documentStatus?.ok) {
            const effectivePatientId = patientId || patientCode;

            if (!effectivePatientId) {
                // Se não há código do paciente, mostra input manual
                setShowManualInput(true);
            } else {
                // Se há código, ainda precisa mostrar input manual para autenticação
                setShowManualInput(true);
                // Preenche automaticamente o CPF se disponível
                const cpfFromAttributes = findCpfInAttributes();
                if (cpfFromAttributes && !manualPatientCode && !hasUserInteractedWithCpf) {
                    setManualPatientCode(cpfFromAttributes);
                }
            }
        }
    }, [isOpen, isBlocked, documentStatus, patientId, patientCode, findCpfInAttributes]);

    // Carrega os tipos de documentos apenas uma vez quando as permissões estão ok e temos token
    useEffect(() => {
        if (isOpen && !isBlocked && documentStatus?.ok && patientAuthToken) {
            loadDocumentTypes();
            // Se o token existe mas o nome do paciente não foi decodificado ainda, decodifica
            if (!patientName) {
                decodeTokenAndSetPatientName(patientAuthToken);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, isBlocked, documentStatus?.ok, patientAuthToken]);


    const handleUploadClick = async (appointment: Appointment) => {
        if (isBlocked) {
            addNotification({
                type: 'danger',
                message: getTranslation('Document upload is not available'),
            });
            return;
        }

        // Se o popover já está aberto para o mesmo agendamento, feche-o
        if (showUploadPopover && popoverAppointment?.appointmentCode === appointment.appointmentCode) {
            handleClosePopover();
            return;
        }

        setPopoverAppointment(appointment);
        setSelectedFile(null);
        setSelectedDocumentType('');
        setSelectedFileAttachmentId('');
        setShowUploadPopover(true);

        // Se tem imagem atual disponível, seleciona automaticamente
        if (imageUrl && currentImageAttachment) {
            await handleUseCurrentImageSilent();
        }
    };

    const handleClosePopover = () => {
        setShowUploadPopover(false);
        setPopoverAppointment(null);
        setSelectedFile(null);
        setSelectedDocumentType('');
        setSelectedFileAttachmentId('');
    };

    const handleUseCurrentImageSilent = async () => {
        if (!imageUrl || !currentImageAttachment) return;

        try {
            // Buscar a imagem da URL e converter para File
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            // Criar um File object com o nome original do attachment
            const file = new File([blob], currentImageAttachment.name, {
                type: currentImageAttachment.mimeType || 'image/jpeg',
            });

            setSelectedFile(file);
            setSelectedFileAttachmentId(currentImageAttachment._id || '');
        } catch (error) {
            console.error('Error fetching current image:', error);
            // Silencioso - não mostra notificação
        }
    };

    const handleUseCurrentImage = async () => {
        if (!imageUrl || !currentImageAttachment) return;

        try {
            // Buscar a imagem da URL e converter para File
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            // Criar um File object com o nome original do attachment
            const file = new File([blob], currentImageAttachment.name, {
                type: currentImageAttachment.mimeType || 'image/jpeg',
            });

            setSelectedFile(file);
            setSelectedFileAttachmentId(currentImageAttachment._id || '');
        } catch (error) {
            console.error('Error fetching current image:', error);
            addNotification({
                type: 'danger',
                message: getTranslation('Failed to load current image'),
            });
        }
    };


    const handleRefreshAppointments = async () => {
        if (!patientAuthToken || !manualPatientCode.trim()) {
            addNotification({
                type: 'warning',
                message: 'Por favor, faça a busca por CPF primeiro para autenticar o paciente',
            });
            return;
        }

        if (!selectedWorkspace) {
            addNotification({
                type: 'danger',
                message: 'Workspace não selecionado',
            });
            return;
        }

        setLoading(true);
        try {
            
            // Recarrega os agendamentos do paciente
            const appointmentsData = await AppointmentService.getPatientAppointments(
                selectedWorkspace._id,
                patientAuthToken
            );

            // Carrega status dos documentos para os agendamentos
            const appointmentsWithDocuments = await loadDocumentStatusForAppointments(
                appointmentsData,
                patientAuthToken
            );
            setAppointments(appointmentsWithDocuments);

            addNotification({
                type: 'success',
                message: 'Agendamentos atualizados com sucesso',
            });
        } catch (error) {
            console.error('Error refreshing appointments:', error);
            
            let errorMessage = 'Falha ao atualizar agendamentos';
            if (error.response?.status === 404) {
                errorMessage = 'Paciente não encontrado';
            } else if (error.response?.status === 401) {
                errorMessage = 'Token de autenticação inválido';
                // Limpa os dados quando o token é inválido
                setAppointments([]);
                setDocumentTypes([]);
                setPatientAuthToken('');
                setPatientName('');
                setHasUserInteractedWithCpf(false);
            }

            addNotification({
                type: 'danger',
                message: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    // Removido handleFileSelect - agora só usa imagem atual

    const handleManualSearch = async () => {
        if (!manualPatientCode.trim()) {
            addNotification({
                type: 'danger',
                message: 'Por favor, insira o CPF do paciente',
            });
            return;
        }

        // Valida se o CPF tem 11 dígitos
        const cleanCpf = manualPatientCode.replace(/\D/g, '');
        if (cleanCpf.length !== 11) {
            addNotification({
                type: 'danger',
                message: 'CPF deve conter 11 dígitos',
            });
            return;
        }

        if (!selectedWorkspace) {
            addNotification({
                type: 'danger',
                message: 'Workspace não selecionado',
            });
            return;
        }

        setLoading(true);
        try {
            // Primeiro autentica o paciente para obter o token JWT
            const token = await DocumentService.authenticatePatient(
                selectedWorkspace._id,
                cleanCpf
            );
            
            setPatientAuthToken(token);
            decodeTokenAndSetPatientName(token);

            // Depois busca os agendamentos usando o token
            const appointmentsData = await AppointmentService.getPatientAppointments(
                selectedWorkspace._id,
                token
            );

            // Carrega status dos documentos
            const appointmentsWithDocuments = await loadDocumentStatusForAppointments(
                appointmentsData,
                token
            );
            setAppointments(appointmentsWithDocuments);

            addNotification({
                type: 'success',
                message: 'Agendamentos carregados com sucesso',
            });
        } catch (error) {
            console.error('Error during patient authentication or loading appointments:', error);
            
            // Limpa os dados quando a autenticação falha
            setAppointments([]);
            setDocumentTypes([]);
            setPatientAuthToken('');
            setPatientName('');
            setHasUserInteractedWithCpf(false);
            
            let errorMessage = 'Falha ao autenticar paciente ou carregar agendamentos';
            if (error.response?.status === 404) {
                errorMessage = 'Paciente não encontrado';
            } else if (error.response?.status === 401) {
                errorMessage = 'CPF inválido ou não autorizado';
            }

            addNotification({
                type: 'danger',
                message: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePatientCodeKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            handleManualSearch();
        }
    };

    // Função para verificar status do documento após upload
    const checkDocumentStatusAfterUpload = async (scheduleCode: string, attempt: number = 1) => {
        if (!selectedWorkspace || !patientAuthToken) {
            console.warn('checkDocumentStatusAfterUpload: Missing workspace or auth token');
            return;
        }

        try {
            const documents = await DocumentService.listDocuments(selectedWorkspace._id, {
                scheduleCode: scheduleCode,
            }, patientAuthToken);

            // Atualiza os arquivos do agendamento específico
            setAppointments((prevAppointments) =>
                prevAppointments.map((apt) =>
                    apt.appointmentCode === scheduleCode
                        ? {
                              ...apt,
                              files: Array.isArray(documents) ? documents.map((doc) => ({
                                  id: doc.id,
                                  originalName: doc.originalName,
                                  fileTypeCode: doc.fileTypeCode,
                                  createdAt: doc.createdAt,
                                  externalId: doc.externalId,
                              })) : [],
                          }
                        : apt
                )
            );

            // Se não encontrou documentos na primeira tentativa, tenta novamente após 3 segundos
            if (Array.isArray(documents) && documents.length === 0 && attempt === 1) {
                setTimeout(() => {
                    checkDocumentStatusAfterUpload(scheduleCode, 2);
                }, 3000);
            }
        } catch (error) {
            console.error('Error checking document status after upload:', error);
            // Se falhou na primeira tentativa, tenta novamente
            if (attempt === 1) {
                setTimeout(() => {
                    checkDocumentStatusAfterUpload(scheduleCode, 2);
                }, 2000);
            }
        }
    };

    const handleUpload = async () => {
        if (
            !selectedFile ||
            !popoverAppointment ||
            !selectedDocumentType ||
            !selectedWorkspace ||
            !patientAuthToken
        ) {
            addNotification({
                type: 'danger',
                message: getTranslation('Please select document type and ensure image is selected'),
            });
            return;
        }

        setUploading(true);
        try {
            await DocumentService.uploadDocument(selectedWorkspace._id, {
                file: selectedFile,
                scheduleCode: popoverAppointment.appointmentCode,
                description: '',
                appointmentTypeCode: popoverAppointment.appointmentTypeCode,
                fileTypeCode: selectedDocumentType,
                externalId: selectedFileAttachmentId || undefined,
            }, patientAuthToken);

            addNotification({
                type: 'success',
                message: getTranslation('Document uploaded successfully'),
            });

            // Ativa o efeito de sucesso no botão do agendamento
            setSuccessButtonId(popoverAppointment.appointmentCode);
            setTimeout(() => {
                setSuccessButtonId('');
            }, 2000); // Remove o efeito após 2 segundos

            // Verifica o status do documento após o upload (com delay para PDFs)
            setTimeout(async () => {
                await checkDocumentStatusAfterUpload(popoverAppointment.appointmentCode);
            }, 1000);

            // Fecha o popover e limpa o formulário
            handleClosePopover();
        } catch (error) {
            console.error('Error uploading document:', error);
            addNotification({
                type: 'danger',
                message: getTranslation('Failed to upload document'),
            });
        } finally {
            setUploading(false);
        }
    };

    const formatDateTime = (dateTimeStr: string) => {
        try {
            const date = new Date(dateTimeStr);
            return {
                date: date.toLocaleDateString('pt-BR'),
                time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            };
        } catch {
            return { date: dateTimeStr, time: '' };
        }
    };

    if (!isOpen) return null;

    return (
        <SideModalContainer>
            <Content>
                {statusLoading ? (
                    <StatusLoadingSection>
                        <Spin />
                        <p>{getTranslation('Checking document upload permissions...')}</p>
                    </StatusLoadingSection>
                ) : isBlocked ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '40px 20px',
                        color: '#666'
                    }}>
                        <div style={{ 
                            fontSize: '40px',
                            marginBottom: '20px'
                        }}>
                            {documentStatus?.code === 'ERP_USERNAME_UNSETTLED' ? '⚙️' : '⚠️'}
                        </div>
                        
                        <h3 style={{ 
                            color: '#333', 
                            marginBottom: '15px',
                            fontSize: '18px'
                        }}>
                            {documentStatus?.code === 'ERP_USERNAME_UNSETTLED'
                                ? 'Configuração Necessária'
                                : 'Funcionalidade Indisponível'}
                        </h3>
                        
                        <p style={{ 
                            lineHeight: '1.5',
                            margin: '0 0 20px 0'
                        }}>
                            {documentStatus?.code === 'ERP_USERNAME_UNSETTLED' &&
                                'Usuário do ERP não configurado. Entre em contato com a supervisão para configurar o usuário do ERP.'}
                            {documentStatus?.code === 'INTEGRATION_NOT_VALID' &&
                                getTranslation('Document upload feature is not available')}
                            {documentStatus?.code === 'FEATURE_DISABLED' &&
                                getTranslation('Document upload feature is temporarily unavailable')}
                            {!documentStatus?.code &&
                                getTranslation('Document upload is currently unavailable')}
                        </p>
                    </div>
                ) : (
                    <>
                        {showManualInput && (
                            <ManualInputSection>
                                <ManualInputContainer>
                                    <PatientCodeInput
                                        ref={cpfInputRef}
                                        type='text'
                                        placeholder='Digite o CPF do paciente'
                                        value={manualPatientCode}
                                        onChange={(e) => {
                                            // Marca que o usuário interagiu com o campo
                                            setHasUserInteractedWithCpf(true);
                                            
                                            // Remove tudo que não for número
                                            let value = e.target.value.replace(/\D/g, '');
                                            
                                            // Aplica máscara de CPF: 000.000.000-00
                                            if (value.length <= 11) {
                                                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                                                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                                                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                                            }
                                            
                                            setManualPatientCode(value);
                                        }}
                                        onKeyDown={handlePatientCodeKeyDown}
                                        maxLength={14}
                                    />
                                    <SearchButton
                                        onClick={handleManualSearch}
                                        disabled={loading || manualPatientCode.replace(/\D/g, '').length !== 11}
                                    >
                                        {loading ? '...' : 'Buscar'}
                                    </SearchButton>
                                </ManualInputContainer>
                            </ManualInputSection>
                        )}

                        {patientName && (
                            <PatientNameDisplay>
                                👤 {patientName}
                            </PatientNameDisplay>
                        )}

                        <AppointmentsHeader>
                            <SectionTitle>Agendamentos</SectionTitle>
                            <RefreshButton
                                onClick={handleRefreshAppointments}
                                disabled={loading}
                                title='Atualizar agendamentos'
                            >
                                {loading ? '⟳' : '↻'}
                            </RefreshButton>
                        </AppointmentsHeader>

                        {loading ? (
                            <LoadingArea>
                                <Spin />
                            </LoadingArea>
                        ) : (
                            <AppointmentsList>
                                {appointments.length === 0 ? (
                                    <p>Nenhum agendamento futuro encontrado</p>
                                ) : (
                                    appointments.map((appointment) => {
                                        const { date, time } = formatDateTime(appointment.appointmentDate);

                                        // Verifica se a imagem que está aberta (currentImageAttachment) já foi enviada para este agendamento
                                        const currentImageAlreadySent =
                                            currentImageAttachment &&
                                            currentImageAttachment._id &&
                                            appointment.files?.some(
                                                (file) => file.externalId && file.externalId === currentImageAttachment._id
                                            );

                                        // Se não há imagem aberta, verifica se há documentos enviados para mostrar informação
                                        const hasDocuments = appointment.files && appointment.files.length > 0;

                                        return (
                                            <div key={appointment.appointmentCode}>
                                                <AppointmentCard>
                                                    <AppointmentInfo>
                                                        <div className='appointment-header'>
                                                            <strong>#{appointment.appointmentCode}</strong>
                                                            {currentImageAlreadySent ? (
                                                                <span className='sent-tag'>ENVIADO</span>
                                                            ) : hasDocuments && !currentImageAttachment ? (
                                                                <span className='sent-tag other-docs'>
                                                                    {appointment.files?.length} DOC(S)
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <div>
                                                            {date} {time}
                                                        </div>
                                                        <div>{appointment.doctorName}</div>
                                                        <div>
                                                            {appointment.specialityName}
                                                            {appointment.procedureName && ` - ${appointment.procedureName}`}
                                                        </div>
                                                    </AppointmentInfo>
                                                </AppointmentCard>
                                                {documentStatus?.code !== 'FEATURE_DISABLED' && (
                                                    <UploadButtonContainer>
                                                        <UploadActionButton
                                                            onClick={() => handleUploadClick(appointment)}
                                                            disabled={isBlocked}
                                                            isSuccess={successButtonId === appointment.appointmentCode}
                                                        >
                                                            {successButtonId === appointment.appointmentCode ? '✓ Enviado!' : 'Enviar Documento'}
                                                        </UploadActionButton>
                                                    </UploadButtonContainer>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </AppointmentsList>
                        )}

                        {/* Popover de Upload */}
                        {showUploadPopover && popoverAppointment && (
                            <UploadPopover>
                                <PopoverHeader>
                                    <PopoverTitle>Enviar Documento</PopoverTitle>
                                    <PopoverClose onClick={handleClosePopover} className='mdi mdi-close' />
                                </PopoverHeader>
                                <PopoverContent>
                                    <AppointmentSummary>
                                        <strong>#{popoverAppointment.appointmentCode}</strong>
                                        <div>
                                            {formatDateTime(popoverAppointment.appointmentDate).date}{' '}
                                            {formatDateTime(popoverAppointment.appointmentDate).time}
                                        </div>
                                        <div>{popoverAppointment.doctorName}</div>
                                    </AppointmentSummary>

                                    {currentImageAttachment && imageUrl ? (
                                        <UseCurrentImageSection>
                                            <UseCurrentImageButton
                                                onClick={handleUseCurrentImage}
                                                selected={selectedFileAttachmentId === currentImageAttachment._id}
                                            >
                                                {selectedFileAttachmentId === currentImageAttachment._id ? '✓ ' : ''}
                                                Usar Imagem Atual
                                            </UseCurrentImageButton>
                                            {selectedFile && (
                                                <SelectedFileInfo>Selecionado: {selectedFile.name}</SelectedFileInfo>
                                            )}
                                        </UseCurrentImageSection>
                                    ) : (
                                        <BlockedSection>
                                            <div className='icon'>📷</div>
                                            <h4>Nenhuma Imagem Disponível</h4>
                                            <p>
                                                Por favor, selecione uma imagem na visualização para enviar documentos
                                            </p>
                                        </BlockedSection>
                                    )}

                                    <DocumentTypeSelect
                                        value={selectedDocumentType}
                                        onChange={(e) => setSelectedDocumentType(e.target.value)}
                                    >
                                        <option value=''>Selecionar Tipo</option>
                                        {documentTypes.map((type) => (
                                            <option key={type.code} value={type.code}>
                                                {type.description}
                                            </option>
                                        ))}
                                    </DocumentTypeSelect>

                                    <PopoverActions>
                                        <PopoverCancelButton onClick={handleClosePopover}>Cancelar</PopoverCancelButton>
                                        <UploadButton
                                            onClick={handleUpload}
                                            disabled={!selectedFile || !selectedDocumentType || uploading}
                                        >
                                            {uploading ? 'Enviando...' : 'Enviar'}
                                        </UploadButton>
                                    </PopoverActions>
                                </PopoverContent>
                            </UploadPopover>
                        )}
                    </>
                )}
            </Content>
        </SideModalContainer>
    );
};

export default i18n(PatientAppointmentsDocumentUpload) as FC<PatientAppointmentsDocumentUploadProps>;
