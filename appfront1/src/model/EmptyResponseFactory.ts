import { IResponse, FilterOperator, reservationOriginOptions } from './Interaction';
import { v4 } from 'uuid';
import {
    ICardMediaType,
    IResponseElementFaq,
    IResponseElementHttpHook,
    IResponseElementRoomRate,
    IResponseElementStatusGuia,
    IResponseElementGuiaMedico,
    IResponseElementPrintScreen,
    IResponseElementQRBuscaFornecedor,
    IResponseElementQRBuscaId,
    IResponseElementGuiasBeneficiario,
    IResponseElementEndConversation,
    IResponseElementTransboard,
    IResponseElementBDCheckAccount,
    IResponseElementBDMedicalAppointment,
    IResponseElementBDPatientCreation,
    IResponseElementConversationAssigned,
    AppointmentSortTypes,
    IResponseElementBDAppointmentList,
    BDAppointmentListActionType,
    IResponseElementTemplate,
    IResponseElementComment,
    IResponseElementCampaignEvent,
    ButtonType,
    IResponseElementBDMedicalScale,
    IResponseElementBDResetMedicalAppointment,
    IResponseElementReassignConversation,
    IResponseElementBDReasonForNotScheduling,
    IResponseElementBDConfirmation,
    IResponseElementBDPatientIdentification,
    IResponseElementBDCheckDoctor,
    IResponseElementBDListDoctorSchedules,
    IResponseElementBDPatientRecoverPassword,
    IResponseElementProtocol,
    IResponseElementGenerativeAI,
    IResponseElementBDValidateDoctor,
    IResponseElementGenerativeAIConv,
    IResponseElementWhatsappFlow,
} from 'kissbot-core/lib';
import {
    ResponseType,
    TagsElementAction,
    IResponseElementText,
    IResponseElementGoto,
    IResponseElementPostback,
    IResponseElementSetAttribute,
    SetAttributeAction,
    IResponseElementQuestion,
    QuestionActionOnFailure,
    IResponseElementHotelInfo,
} from 'kissbot-core';

import { IResponseElementCard } from './ResponseElement';

const getBaseResponseBody = () => {
    return {
        id: v4(),
        delay: 1000,
        isResponseValid: false,
        filter: {
            operator: FilterOperator.and,
            conditions: [],
        },
        sendTypping: true,
    };
};

const getBaseResponseBodyWithoutTypping = () => {
    return {
        id: v4(),
        delay: 0,
        isResponseValid: false,
        filter: {
            operator: FilterOperator.and,
            conditions: [],
        },
        sendTypping: false,
    };
};
export class EmptyResponseFactory {
    static createResponse(responseType: string, args?: any): IResponse {
        switch (responseType) {
            case ResponseType.TEXT: {
                return {
                    type: ResponseType.TEXT,
                    elements: [{ text: [''] } as IResponseElementText],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.CARD: {
                return {
                    type: ResponseType.CARD,
                    elements: [
                        {
                            title: '',
                            subtitle: '',
                            text: '',
                            imageUrl: '',
                            media: {
                                type: ICardMediaType.IMAGE,
                                url: '',
                                autoPlay: false,
                                autoLoop: false,
                            },
                            buttons: [],
                            isElementCardValid: false,
                        },
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.WHATSAPP_FLOW: {
                return {
                    type: ResponseType.WHATSAPP_FLOW,
                    elements: [
                        {
                            title: '',
                            text: '',
                            button: {
                                type: 'flow',
                                title: '',
                                value: null
                            },
                        } as IResponseElementWhatsappFlow,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.GOTO: {
                return {
                    type: ResponseType.GOTO,
                    elements: [
                        {
                            value: '',
                            workspaceId: '',
                            botId: '',
                        } as IResponseElementGoto,
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                };
            }
            case ResponseType.POST_BACK: {
                return {
                    type: ResponseType.POST_BACK,
                    elements: [
                        {
                            value: '',
                        } as IResponseElementPostback,
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                };
            }
            case ResponseType.SET_ATTRIBUTE: {
                return {
                    type: ResponseType.SET_ATTRIBUTE,
                    elements: [
                        {
                            name: 'default_country',
                            action: SetAttributeAction.set,
                            type: '',
                            value: '',
                            label: '',
                        } as IResponseElementSetAttribute,
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                };
            }
            case ResponseType.CAROUSEL: {
                return {
                    type: ResponseType.CAROUSEL,
                    elements: [
                        {
                            title: '',
                            subtitle: '',
                            text: '',
                            imageUrl: '',
                            media: {
                                type: ICardMediaType.IMAGE,
                                url: '',
                                autoPlay: false,
                                autoLoop: false,
                            },
                            buttons: [],
                            isElementCardValid: false,
                        } as IResponseElementCard,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.QUESTION: {
                return {
                    type: ResponseType.QUESTION,
                    elements: [
                        {
                            actionOnFailure: QuestionActionOnFailure.next,
                            askWhenFilled: false,
                            entity: '',
                            lifespan: 1,
                            name: '',
                            required: false,
                            text: [''],
                            errorMessages: [''],
                        } as IResponseElementQuestion,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.GOBACK: {
                return {
                    type: ResponseType.GOBACK,
                    elements: [],
                    ...getBaseResponseBodyWithoutTypping(),
                    isResponseValid: true,
                };
            }
            case ResponseType.TAGS: {
                return {
                    type: ResponseType.TAGS,
                    elements: [
                        {
                            action: TagsElementAction.ADD,
                            color: '#007bff',
                            name: '',
                        },
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                };
            }
            case ResponseType.IMAGE: {
                return {
                    type: ResponseType.IMAGE,
                    elements: [
                        {
                            imageUrl: '',
                        },
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.VIDEO: {
                return {
                    type: ResponseType.VIDEO,
                    elements: [
                        {
                            videoUrl: '',
                        },
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.SWITCH_TEXT: {
                return {
                    type: ResponseType.SWITCH_TEXT,
                    elements: [
                        {
                            name: '',
                            default: [''],
                            switch: [
                                {
                                    case: '',
                                    text: [''],
                                },
                            ],
                            type: '',
                        },
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.ROOM_RATE: {
                return {
                    type: ResponseType.ROOM_RATE,
                    elements: [
                        {
                            chainId: '',
                            promoCode: '',
                            hotelsId: [],
                            roomRateText: '',
                            notFoundMessage: '',
                        } as IResponseElementRoomRate,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.HOTEL_INFO: {
                return {
                    type: ResponseType.HOTEL_INFO,
                    elements: [
                        {
                            chainId: '',
                            hotelsId: [],
                            cityId: [],
                            roomRateText: '',
                            notFoundMessage: '',
                        } as IResponseElementHotelInfo,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.BOOKING_CONFIRMATION: {
                return {
                    type: ResponseType.BOOKING_CONFIRMATION,
                    elements: [
                        {
                            emailDestination: '',
                            reservationOrigin: [
                                {
                                    title: reservationOriginOptions.telephone,
                                    value: reservationOriginOptions.telephone,
                                },
                                {
                                    title: reservationOriginOptions.other_agency,
                                    value: reservationOriginOptions.other_agency,
                                },
                                {
                                    title: reservationOriginOptions.hotel_website,
                                    value: reservationOriginOptions.hotel_website,
                                },
                            ],
                            subject: '',
                            successMessage: '',
                            fields: {
                                bookingName: {
                                    required: true,
                                    visible: true,
                                    label: '',
                                },
                                bookingEmail: {
                                    required: true,
                                    visible: true,
                                    label: '',
                                },
                                arrivalDate: {
                                    required: true,
                                    visible: true,
                                    label: '',
                                },
                                bookingSource: {
                                    required: true,
                                    visible: true,
                                    label: '',
                                },
                            },
                        },
                    ],
                    ...getBaseResponseBody(),
                } as any;
            }
            case ResponseType.BOOKING_CANCELLATION: {
                return {
                    type: ResponseType.BOOKING_CANCELLATION,
                    elements: [
                        {
                            emailDestination: '',
                            subject: '',
                            successMessage: '',
                            label: '',
                            fields: {
                                bookingName: {
                                    required: true,
                                    visible: true,
                                    label: '',
                                },
                                bookingEmail: {
                                    required: true,
                                    visible: true,
                                    label: '',
                                },
                                arrivalDate: {
                                    required: true,
                                    visible: true,
                                    label: '',
                                },
                                bookingNumber: {
                                    required: true,
                                    visible: true,
                                    label: '',
                                },
                            },
                        },
                    ],
                    ...getBaseResponseBody(),
                } as any;
            }
            case ResponseType.FAQ: {
                return {
                    type: ResponseType.FAQ,
                    elements: [
                        {
                            faqId: '',
                            criteria: '',
                            attrName: '',
                            attrType: '',
                        } as IResponseElementFaq,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.HTTP_HOOK: {
                return {
                    type: ResponseType.HTTP_HOOK,
                    elements: [
                        {
                            url: '',
                            method: 'get',
                            headers: [{ name: '', value: '' }],
                            body: '',
                            attrName: '',
                            attrType: '@sys.any',
                        } as IResponseElementHttpHook,
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                };
            }
            case ResponseType.QUICK_REPLY: {
                return {
                    type: ResponseType.QUICK_REPLY,
                    elements: [
                        {
                            text: [''],
                            buttons: [{ title: 'button #1', value: '', type: ButtonType.goto }],
                        },
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.TRANSBOARD: {
                return {
                    type: ResponseType.TRANSBOARD,
                    elements: [
                        {
                            channelId: '',
                            channelConfigId: '',
                            cannotTransboardGoto: '',
                        } as IResponseElementTransboard,
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                };
            }
            case ResponseType.CONVERSATION_ASSIGNED: {
                return {
                    type: ResponseType.CONVERSATION_ASSIGNED,
                    elements: [
                        {
                            cannotAssignGoto: '',
                            teamId: '',
                            version: 2,
                        } as IResponseElementConversationAssigned,
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                };
            }
            case ResponseType.SET_RECOGNIZER_SCOPE: {
                return {
                    type: ResponseType.SET_RECOGNIZER_SCOPE,
                    elements: [
                        {
                            value: '',
                        },
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                };
            }
            case ResponseType.STATUS_GUIA: {
                return {
                    type: ResponseType.STATUS_GUIA,
                    elements: [
                        {
                            medicalPlan: '',
                            guideStatus: [
                                {
                                    case: '',
                                    text: [''],
                                },
                            ],
                            isEmptyGoto: '',
                            guideNumber: '',
                            guideNumberType: '@sys.any',
                            shouldReturnBeneficiarioNumber: false,
                        } as IResponseElementStatusGuia,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.GUIA_MEDICO: {
                return {
                    type: ResponseType.GUIA_MEDICO,
                    elements: [
                        {
                            random: false,
                            limit: 3,
                            healthPlan: '',
                            cityAttribute: '',
                            specialityAttribute: '',
                            serviceCodeAttribute: '',
                            specializedServiceAttribute: '',
                            providerAttribute: '',
                            isEmptyGoto: '',
                            successMessage: [''],
                            rules: [
                                {
                                    name: '',
                                    value: '',
                                },
                            ],
                            shouldReturnCnpj: false,
                        } as IResponseElementGuiaMedico,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.QR_BUSCA_FORNECEDOR: {
                return {
                    type: ResponseType.QR_BUSCA_FORNECEDOR,
                    elements: [
                        {
                            cnpjAttr: '',
                            idProcessoAttr: '',
                            panelId: '',
                            serviceAddress: '',
                            isEmptyGoto: '',
                        } as IResponseElementQRBuscaFornecedor,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.QR_BUSCA_ID: {
                return {
                    type: ResponseType.QR_BUSCA_ID,
                    elements: [
                        {
                            idAttr: '',
                            saveOnAttr: '',
                        } as IResponseElementQRBuscaId,
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                };
            }
            case ResponseType.PRINT_SCREEN: {
                return {
                    type: ResponseType.PRINT_SCREEN,
                    elements: [
                        {
                            text: [''],
                        } as IResponseElementPrintScreen,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.GUIA_BENEFICIARIO: {
                return {
                    type: ResponseType.GUIA_BENEFICIARIO,
                    elements: [
                        {
                            medicalPlan: '',
                            isEmptyGoto: '',
                            beneficiarioNumber: '',
                            beneficiarioNumberType: '@sys.any',
                        } as IResponseElementGuiasBeneficiario,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.END_CONVERSATION: {
                return {
                    type: ResponseType.END_CONVERSATION,
                    elements: [
                        {
                            showRating: false,
                            isClosedByUser: true,
                            customMessages: {
                                confirmation: {
                                    title: '',
                                    description: '',
                                },
                                rating: {
                                    title: '',
                                    description: '',
                                },
                            },
                        } as IResponseElementEndConversation,
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                    isResponseValid: true,
                };
            }
            case 'MEDICAL_APPOINTMENT': {
                return {
                    type: 'MEDICAL_APPOINTMENT' as any,
                    elements: [
                        {
                            attrNameConvenioHandler: '',
                            attrNameCpf: '',
                            attrNameDataNascimento: '',
                            attrNameEmail: '',
                            attrNameEspecialidadeHandler: '',
                            attrNameProcedimentoHandler: '',
                            attrNameRecursoHandler: '',
                            isAgendamentoNaoConfirmadoGoto: '',
                            attrNamePhone: '',
                            serviceEndpointAttrName: '',
                            servicePasswordAttrName: '',
                            serviceUsernameAttrName: '',
                            attrNameTelefone: '',
                            isEmptyGoto: '',
                            isErrorGoto: '',
                            transferToHumanGoto: '',
                            notAccountGoto: '',
                            onConfirmAppointmentValueGoto: '',
                            onRejectAppointmentValueGoto: '',
                        } as any,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case 'MNGS_ACCOUNT': {
                return {
                    type: 'MNGS_ACCOUNT' as any,
                    elements: [
                        {
                            accountCreatedGoto: '',
                            attrNameCpf: '',
                            attrNameDataNascimento: '',
                            attrNameEmail: '',
                            attrNameName: '',
                            attrNameSex: '',
                            isEmptyGoto: '',
                            isErrorGoto: '',
                            serviceEndpointAttrName: '',
                            servicePasswordAttrName: '',
                            serviceUsernameAttrName: '',
                            transferToHumanGoto: '',
                        } as any,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case 'MNGS_CHECK_APPOINTMENT': {
                return {
                    type: 'MNGS_CHECK_APPOINTMENT' as any,
                    elements: [
                        {
                            serviceEndpointAttrName: '',
                            servicePasswordAttrName: '',
                            serviceUsernameAttrName: '',
                            attrNameCpf: '',
                            attrNameDataNascimento: '',
                            attrNameId: '',
                            attrNameTypeCheck: '',
                            isEmptyGoto: '',
                            isErrorGoto: '',
                            transferToHumanGoto: '',
                            accountNotExistsGoto: '',
                            actionIgnoredGoto: '',
                        } as any,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case 'MNGS_CHECK_ACCOUNT': {
                return {
                    type: 'MNGS_CHECK_ACCOUNT' as any,
                    elements: [
                        {
                            serviceEndpointAttrName: '',
                            serviceUsernameAttrName: '',
                            servicePasswordAttrName: '',
                            attrNameCpf: '',
                            transferToHumanGoto: '',
                            isErrorGoto: '',
                            accountExistsGoto: '',
                            accountNotExistsGoto: '',
                        } as any,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.BOT_DESIGNER_CHECK_ACCOUNT: {
                return {
                    type: ResponseType.BOT_DESIGNER_CHECK_ACCOUNT,
                    elements: [
                        {
                            url: '',
                            integrationId: '',
                            attrNameCpf: '',
                            attrNameBornDate: '',
                            attrNameEmail: '',
                            attrNameName: '',
                            attrNamePhone: '',
                            attrNameSex: '',
                            attrNameId: '',
                            isErrorGoto: '',
                            accountExistsDataMismatchGoto: '',
                            accountMismatchGoto: '',
                            accountExistsGoto: '',
                            accountNotExistsGoto: '',
                            attrNameLastAppointmentDate: '',
                            attrNameNextAppointmentDate: '',
                        } as IResponseElementBDCheckAccount,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.BOT_DESIGNER_MEDICAL_APPOINTMENT: {
                return {
                    type: ResponseType.BOT_DESIGNER_MEDICAL_APPOINTMENT,
                    elements: [
                        {
                            steps: [],
                            attrNameStep: '',
                            attrNameWeekDay: '',
                            attrNameStartedAppointment: '',
                            attrNameRestartAppointment: '',
                            attrNameFinishedAppointment: '',
                            integrationId: '',
                            attrNameInsurance: '',
                            attrNameInsurancePlan: '',
                            attrNameInsuranceSubPlan: '',
                            attrNameProcedure: '',
                            attrNameAppointmentType: '',
                            attrNameSpeciality: '',
                            attrNameDoctor: '',
                            attrNameAppointment: '',
                            isAgendamentoNaoConfirmadoGoto: '',
                            onConfirmAppointmentValueGoto: '',
                            onRejectAppointmentValueGoto: '',
                            attrNameOrganizationUnit: '',
                            attrNamePhone: '',
                            attrNameBornDate: '',
                            attrNameCpf: '',
                            attrNameEmail: '',
                            transferToHumanGoto: '',
                            jumpSpecialityOneItem: false,
                            isErrorGoto: '',
                            isEmptyGoto: '',
                            checkAccountGoto: '',
                            fromDay: 0,
                            untilDay: 0,
                            randomize: false,
                            limit: 0,
                            url: '',
                            sortMethod: AppointmentSortTypes.default,
                            attrNamePeriodOfDay: '',
                        } as IResponseElementBDMedicalAppointment,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.BOT_DESIGNER_PATIENT_CREATION: {
                return {
                    type: ResponseType.BOT_DESIGNER_PATIENT_CREATION,
                    elements: [
                        {
                            integrationId: '',
                            attrNameBornDate: '',
                            attrNameSex: '',
                            attrNameName: '',
                            attrNameCpf: '',
                            attrNameEmail: '',
                            saveTokenOnAttr: '',
                            transferToHumanGoto: '',
                            isErrorGoto: '',
                            accountCreatedGoto: '',
                            isEmptyGoto: '',
                            url: '',
                        } as IResponseElementBDPatientCreation,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.BOT_DESIGNER_APPOINTMENT_LIST: {
                return {
                    type: ResponseType.BOT_DESIGNER_APPOINTMENT_LIST,
                    elements: [
                        {
                            url: '',
                            integrationId: '',
                            attrNameBornDate: '',
                            attrNameCpf: '',
                            attrNameId: '',
                            attrNameActionType: BDAppointmentListActionType.view,
                            isErrorGoto: '',
                            isEmptyGoto: '',
                            actionIgnoredGoto: '',
                            accountNotExistsGoto: '',
                        } as IResponseElementBDAppointmentList,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.TEMPLATE: {
                return {
                    type: ResponseType.TEMPLATE,
                    elements: [
                        {
                            templateId: '',
                        } as IResponseElementTemplate,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.COMMENT: {
                return {
                    type: ResponseType.COMMENT,
                    elements: [
                        {
                            comment: [''],
                        } as IResponseElementComment,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.CAMPAIGN_EVENT: {
                return {
                    type: ResponseType.CAMPAIGN_EVENT,
                    elements: [
                        {
                            data: '',
                        } as IResponseElementCampaignEvent,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.BOT_DESIGNER_MEDICAL_SCALE: {
                return {
                    type: ResponseType.BOT_DESIGNER_MEDICAL_SCALE,
                    elements: [
                        {
                            integrationId: '',
                            integrationUrl: '',
                        } as IResponseElementBDMedicalScale,
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                };
            }
            case ResponseType.BOT_DESIGNER_VALIDATE_DOCTOR: {
                return {
                    type: ResponseType.BOT_DESIGNER_VALIDATE_DOCTOR,
                    elements: [
                        {
                            integrationId: '',
                            integrationUrl: '',
                            attrNameCrm: '',
                            attrNameUf: '',
                        } as IResponseElementBDValidateDoctor,
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                };
            }
            case ResponseType.BOT_DESIGNER_REASON_FOR_NOT_SCHEDULING: {
                return {
                    type: ResponseType.BOT_DESIGNER_REASON_FOR_NOT_SCHEDULING,
                    elements: [
                        {
                            integrationId: '',
                            integrationUrl: '',
                            attrNameAppointmentType: '',
                            attrNameOrganizationUnit: '',
                            attrNameInsurance: '',
                            attrNameInsurancePlan: '',
                            attrNameInsuranceSubPlan: '',
                            attrNamePlanCategory: '',
                            attrNameSpeciality: '',
                            attrNameProcedure: '',
                            attrNameChooseDoctor: '',
                            attrNameDoctor: '',
                            attrNameOccupationArea: '',
                            attrNameLaterality: '',
                            attrNameOrganizationUnitLocation: '',
                            attrNameInsuranceNumber: '',
                            attrNamePeriodOfDay: '',
                            attrNameTypeOfService: '',
                        } as IResponseElementBDReasonForNotScheduling,
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                } as IResponse;
            }
            case ResponseType.BOT_DESIGNER_RESET_MEDICAL_APPOINTMENT: {
                return {
                    type: ResponseType.BOT_DESIGNER_RESET_MEDICAL_APPOINTMENT,
                    elements: [
                        {
                            steps: [],
                            integrationCode: '',
                            integrationId: '',
                            attrNameStep: '',
                            attrNameWeekDay: '',
                            attrNameStartedAppointment: '',
                            attrNameRestartAppointment: '',
                            attrNameFinishedAppointment: '',

                            attrNameAppointmentType: '',
                            attrNameOrganizationUnit: '',
                            attrNameInsurance: '',
                            attrNameInsurancePlan: '',
                            attrNameInsuranceSubPlan: '',
                            attrNamePlanCategory: '',
                            attrNameSpeciality: '',
                            attrNameProcedure: '',
                            attrNameChooseDoctor: '',
                            attrNameDoctor: '',
                            attrNameOccupationArea: '',
                            attrNameLaterality: '',
                            attrNameOrganizationUnitLocation: '',
                            attrNamePatientId: '',
                            attrNameAppointment: '',
                            attrNamePhone: '',
                            attrNameName: '',
                            attrNameBornDate: '',
                            attrNameCpf: '',
                            attrNameSex: '',
                            attrNameEmail: '',
                            attrNameInsuranceNumber: '',
                            attrNamePeriodOfDay: '',
                            attrNameTypeOfService: '',
                            url: '',
                            attrNameScheduleToCancelCode: '',
                        } as IResponseElementBDResetMedicalAppointment,
                    ],
                    ...getBaseResponseBody(),
                } as IResponse;
            }
            case ResponseType.REASSIGN_CONVERSATION: {
                return {
                    type: ResponseType.REASSIGN_CONVERSATION,
                    elements: [
                        {
                            teamId: '',
                        } as IResponseElementReassignConversation,
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                    isResponseValid: true,
                };
            }
            case ResponseType.BOT_DESIGNER_CONFIRMATION: {
                return {
                    type: ResponseType.BOT_DESIGNER_CONFIRMATION,
                    elements: [
                        {
                            integrationId: '',
                            url: '',
                        } as IResponseElementBDConfirmation,
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                    isResponseValid: false,
                } as IResponse;
            }
            case ResponseType.BOT_DESIGNER_PATIENT_IDENTIFICATION: {
                return {
                    type: ResponseType.BOT_DESIGNER_PATIENT_IDENTIFICATION,
                    elements: [
                        {
                            integrationId: '',
                            integrationUrl: '',
                            type: 'requestAcceptance',
                            attrNameBornDate: '',
                            attrNameCpf: '',
                            attrNamePhone: '',
                            isErrorGoto: '',
                            isAcceptedGoto: '',
                            attrNameName: '',
                            isNotRequestedAcceptance: '',
                            isRejectedGoto: '',
                            isRequestedAcceptance: '',
                            attrNameCode: '',
                            isRequestedRevalidation: '',
                        } as IResponseElementBDPatientIdentification,
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                } as IResponse;
            }
            case ResponseType.BOT_DESIGNER_CHECK_DOCTOR: {
                return {
                    type: ResponseType.BOT_DESIGNER_CHECK_DOCTOR,
                    elements: [
                        {
                            attrNamePhone: '',
                            attrNameDocNumber: '',
                            attrNameDoctorData: '',
                            integrationId: '',
                            url: '',
                            notFindedDoctorGoto: '',
                            askDocNumberGoto: '',
                            gotoCpfQuestion: '',
                        } as IResponseElementBDCheckDoctor,
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                };
            }
            case ResponseType.BOT_DESIGNER_DOCTOR_SCHEDULES: {
                return {
                    type: ResponseType.BOT_DESIGNER_DOCTOR_SCHEDULES,
                    elements: [
                        {
                            attrNameDoctorData: '',
                            integrationId: '',
                            url: '',
                        } as IResponseElementBDListDoctorSchedules,
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                };
            }
            case ResponseType.BOT_DESIGNER_APPOINTMENT_RESCHEDULE: {
                return {
                    type: ResponseType.BOT_DESIGNER_APPOINTMENT_RESCHEDULE,
                    elements: [
                        {
                            steps: [],
                            integrationCode: '',
                            integrationId: '',
                            attrNameStep: '',
                            attrNameWeekDay: '',
                            attrNameStartedAppointment: '',
                            attrNameRestartAppointment: '',
                            attrNameFinishedAppointment: '',

                            attrNameAppointmentType: '',
                            attrNameOrganizationUnit: '',
                            attrNameInsurance: '',
                            attrNameInsurancePlan: '',
                            attrNameInsuranceSubPlan: '',
                            attrNamePlanCategory: '',
                            attrNameSpeciality: '',
                            attrNameProcedure: '',
                            attrNameChooseDoctor: '',
                            attrNameDoctor: '',
                            attrNameOccupationArea: '',
                            attrNameLaterality: '',
                            attrNameOrganizationUnitLocation: '',
                            attrNamePatientId: '',
                            attrNameAppointment: '',
                            attrNamePhone: '',
                            attrNameName: '',
                            attrNameBornDate: '',
                            attrNameCpf: '',
                            attrNameSex: '',
                            attrNameEmail: '',
                            attrNameInsuranceNumber: '',
                            attrNamePeriodOfDay: '',
                            attrNameTypeOfService: '',
                            url: '',
                            attrNameScheduleToCancelCode: '',
                        } as IResponseElementBDResetMedicalAppointment,
                    ],
                    ...getBaseResponseBody(),
                } as IResponse;
            }
            case ResponseType.BOT_DESIGNER_RECOVER_PASSWORD: {
                return {
                    type: ResponseType.BOT_DESIGNER_RECOVER_PASSWORD,
                    elements: [
                        {
                            url: '',
                            integrationId: '',
                            attrNameBornDate: '',
                            attrNameCpf: '',
                            attrNamePhone: '',
                            isErrorGoto: '',
                            questions: [],
                        } as IResponseElementBDPatientRecoverPassword,
                    ],
                    ...getBaseResponseBody(),
                } as IResponse;
            }
            case ResponseType.BOT_DESIGNER_SAP_INTEGRATION: {
                return {
                    type: ResponseType.BOT_DESIGNER_SAP_INTEGRATION,
                    elements: [
                        {
                            attrRequesitionNumber: '',
                            attrPhoneNumberDebug: '',
                            isErrorGoto: '',
                        } as any,
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                } as IResponse;
            }
            case ResponseType.BOT_DESIGNER_SAP_INTEGRATION_REMOVE: {
                return {
                    type: ResponseType.BOT_DESIGNER_SAP_INTEGRATION_REMOVE,
                    elements: [
                        {
                            attrRequesitionNumber: '',
                            attrPhoneNumberDebug: '',
                            isErrorGoto: '',
                        } as any,
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                } as IResponse;
            }
            case ResponseType.BOT_DESIGNER_RECOVER_LOST_SCHEDULE: {
                return {
                    type: ResponseType.BOT_DESIGNER_RECOVER_LOST_SCHEDULE,
                    elements: [
                        {
                            integrationId: '',
                            url: '',
                        } as IResponseElementBDConfirmation,
                    ],
                    ...getBaseResponseBodyWithoutTypping(),
                    isResponseValid: false,
                } as IResponse;
            }
            case ResponseType.BOT_DESIGNER_NPS_SCORE: {
                return {
                    type: ResponseType.BOT_DESIGNER_NPS_SCORE,
                    elements: [],
                    ...getBaseResponseBodyWithoutTypping(),
                    isResponseValid: true,
                } as IResponse;
            }
            case ResponseType.PROTOCOL: {
                return {
                    type: ResponseType.PROTOCOL,
                    elements: [
                        {
                            insuranceCardNumber: '',
                        } as IResponseElementProtocol,
                    ],
                    ...getBaseResponseBody(),
                };
            }
            case ResponseType.GENERATIVE_AI: {
                return {
                    type: ResponseType.GENERATIVE_AI,
                    elements: [{ startMessage: '' } as IResponseElementGenerativeAI],
                    ...getBaseResponseBody(),
                    isResponseValid: true,
                };
            }
              case ResponseType.GENERATIVE_AI_CONV: {
                return {
                    type: ResponseType.GENERATIVE_AI_CONV,
                    elements: [{ startMessage: '' } as IResponseElementGenerativeAIConv],
                    ...getBaseResponseBody(),
                    isResponseValid: true,
                };
            }
            default:
                throw new Error(`response not implement: ${responseType}`);
        }
    }
}
