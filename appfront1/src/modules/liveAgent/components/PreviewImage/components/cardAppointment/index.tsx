import React, { FC, useEffect, useRef, useState } from 'react';
import { CardAppointmentProps } from './props';
import { Content, AppointmentDate, AppointmentDetails, Actions, ButtonSend, ButtonError, ButtonSended } from './styled';
import moment from 'moment';
import { ManagerService } from '../modalIntegration/integration.service';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';

interface CropDataResponse {
    type: string;
    data: {
        croppedImage: string;
        id: number;
        src: string;
        file: {
            name: string;
            extension: string;
        };
    };
}

interface ImageDataResponse {
    type: string;
    data: {
        croppedImage: string;
        id: number;
        src: string;
        file: {
            name: string;
            extension: string;
        };
    };
}

const CardAppointment: FC<CardAppointmentProps & I18nProps> = ({
    appointment,
    attachmentId,
    getTranslation,
    cropping,
    imageTypeSelected,
    workspaceId,
}) => {
    const [requestedCrop, setRequestedCrop] = useState(false);
    const [cropWithError, setCropWithError] = useState(false);
    const [imageSended, setImageSended] = useState(false);
    const [sendingImage, setSendingImage] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<any[]>([]);

    const [fetchedImages, setFetchedImages] = useState(false);

    const imageTypeSelectedRef: any = useRef(null);
    imageTypeSelectedRef.current = { imageTypeSelected };

    useEffect(() => {
        getUploadedImages();
    }, []);

    const getUploadedImages = async () => {
        const response = await ManagerService.getImages(workspaceId, {
            appointmentId: appointment.handle,
        });

        setFetchedImages(true);
        setUploadedImages(response.data || []);
    };

    useEffect(() => {
        if (uploadedImages?.length > 0) {
            const sended = uploadedImages.find((doc) => doc.nome?.includes(attachmentId));
            setImageSended(!!sended);
        }
    }, [uploadedImages.length, attachmentId]);

    const handler_crop_done = (event: CustomEvent<CropDataResponse> | any) => {
        if (event.detail.data.id === appointment.handle) {
            sendCroppedImage(event.detail);
            setRequestedCrop(false);
        }
    };

    const sendCroppedImage = async ({ data, type }: CropDataResponse) => {
        if (type !== 'success') {
            return setCropWithError(true);
        }

        setSendingImage(true);

        try {
            const request = await ManagerService.uploadImage(workspaceId, {
                appointmentId: data.id,
                blob: data.croppedImage,
                fileName: `${data.file.name}.${data.file.extension}`,
                attachmentId: attachmentId,
                imageType: imageTypeSelectedRef.current.imageTypeSelected,
            });

            setSendingImage(false);

            if (request.status === 201) {
                return setImageSended(true);
            }
            throw 'invalid status code';
        } catch (error) {
            return setCropWithError(true);
        }
    };

    const sendFullImage = async ({ data, type }: ImageDataResponse) => {
        if (type !== 'success') {
            return setCropWithError(true);
        }

        setSendingImage(true);

        try {
            const request = await ManagerService.uploadImage(workspaceId, {
                appointmentId: data.id,
                blob: data.croppedImage,
                fileName: `${data.file.name}.${data.file.extension}`,
                attachmentId: attachmentId,
                imageType: imageTypeSelectedRef.current.imageTypeSelected,
            });

            setSendingImage(false);

            if (request.status === 201) {
                return setImageSended(true);
            }
            throw 'invalid status code';
        } catch (error) {
            return setCropWithError(true);
        }
    };

    const requestCrop = () => {
        setCropWithError(false);
        setRequestedCrop(true);

        if (cropping) {
            setTimeout(() => {
                window.dispatchEvent(
                    new CustomEvent('@crop_requested', {
                        detail: {
                            id: appointment.handle,
                        },
                    })
                );
            }, 300);
        } else {
            setTimeout(() => {
                window.dispatchEvent(
                    new CustomEvent('@image_request', {
                        detail: {
                            id: appointment.handle,
                        },
                    })
                );
            }, 300);
        }
    };

    const handler_image_done = (event: CustomEvent<ImageDataResponse> | any) => {
        if (event.detail.data.id === appointment.handle) {
            sendFullImage(event.detail);
            setRequestedCrop(false);
        }
    };

    useEffect(() => {
        window.addEventListener('@crop_done', handler_crop_done);
        window.addEventListener('@image_data_done', handler_image_done);

        return () => {
            window.removeEventListener('@crop_done', handler_crop_done);
            window.removeEventListener('@image_data_done', handler_image_done);
        };
    }, []);

    return (
        <Content>
            <AppointmentDate>{moment(appointment.data).format('LLL')}</AppointmentDate>
            <AppointmentDetails>
                <p>
                    <b>{`${getTranslation('Code')}:`} </b>
                    <span>{appointment?.handle || '-'}</span>
                </p>
                <p>
                    <b>{`${getTranslation('Service')}:`} </b>
                    <span>{appointment?.servico?.nome || '-'}</span>
                </p>
                <p>
                    <b>{`${getTranslation('Doctor')}:`} </b>
                    <span>{appointment?.medico?.nome || '-'}</span>
                </p>
                <p>
                    <b>{`${getTranslation('Speciality')}:`} </b>
                    <span>{appointment?.especialidade?.nome || '-'}</span>
                </p>
                <p>
                    <b>{`${getTranslation('Unity')}:`} </b>
                    <span>{appointment?.unidadeFilial?.nome || '-'}</span>
                </p>
                <Actions>
                    {cropWithError ? (
                        <ButtonError title={getTranslation('Send image')} onClick={requestCrop}>
                            {getTranslation('Error. Try again')}
                        </ButtonError>
                    ) : fetchedImages ? (
                        !imageSended ? (
                            sendingImage ? (
                                <ButtonSend onClick={requestCrop}>{`${getTranslation('Sending')}..`}</ButtonSend>
                            ) : (
                                <ButtonSend title={getTranslation('Send image')} onClick={requestCrop}>
                                    {requestedCrop ? `${getTranslation('Wait')}..` : `${getTranslation('Send image')}`}
                                </ButtonSend>
                            )
                        ) : (
                            <ButtonSended>{`${getTranslation('Sended')}`}</ButtonSended>
                        )
                    ) : (
                        <ButtonSend onClick={requestCrop}>{`${getTranslation('Wait')}..`}</ButtonSend>
                    )}
                </Actions>
            </AppointmentDetails>
        </Content>
    );
};

export default i18n(CardAppointment) as FC<CardAppointmentProps>;
