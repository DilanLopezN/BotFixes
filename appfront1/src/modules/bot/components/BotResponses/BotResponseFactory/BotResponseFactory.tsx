import React, { Component } from 'react';
import { BotResponseProps } from '../interfaces';
import { OrganizationSettings, ResponseType } from 'kissbot-core';
import { BotResponseCard } from '../BotResponseCard/BotResponseCard';
import { BotResponseSetAttribute } from '../BotResponseSetAttribute/BotResponseSetAttribute';
import { BotResponseCarousel } from '../BotResponseCarousel/BotResponseCarousel';
import { BotResponseQuestion } from '../BotResponseQuestion/BotResponseQuestion';
import BotResponseGoto from '../BotResponseGoto/BotResponseGoto';
import { BotResponseGoBack } from '../BotResponseGoBack/BotResponseGoBack';
import BotResponseTag from '../BotResponseTag/BotResponseTag';
import { BotResponseImage } from '../BotResponseImage/BotResponseImage';
import { BotResponseVideo } from '../BotResponseVideo/BotResponseVideo';
import { BotResponseSwitchText } from '../BotResponseSwitchText/BotResponseSwitchText';
import { BotResponseFaq } from '../BotResponseFaq/BotResponseFaq';
import { BotResponseHttpHook } from '../BotResponseHttpHook/BotResponseHttpHook';
import { BotResponseQuickReply } from '../BotResponseQuickReply/BotResponseQuickReply';
import { BotResponseRecognizerScope } from '../BotResponseRecognizerScope/BotResponseRecognizerScope';
import { BotResponseStatusGuide } from '../Segments/Health/BotResponseStatusGuide/BotResponseStatusGuide';
import { BotResponseMedicalGuide } from '../Segments/Health/BotResponseMedicalGuide/BotResponseMedicalGuide';
import { BotResponsePrintScreen } from '../BotResponsePrintScreen/BotResponsePrintScreen';
import { BotResponseSearchSupplier } from '../Segments/Health/BotResponseSearchSupplier/BotResponseSearchSupplier';
import { BotResponseSearchId } from '../Segments/Health/BotResponseSearchId/BotResponseSearchId';
import { BotResponseGuiaBeneficiario } from '../Segments/Health/BotResponseGuiaBeneficiario/BotResponseGuiaBeneficiario';
import { BotResponseEndConversation } from '../BotResponseEndConversation/BotResponseEndConversation';
import I18n from '../../../../i18n/components/i18n';
import { BotResponseMedicalAppointment } from '../Segments/Health/BotResponseMedicalAppointment /BotResponseMedicalAppointment';
import { BotResponseTransboard } from '../BotResponseTransboard/BotResponseTransboard';
import { BotResponseMngsAccount } from '../Segments/Health/BotResponseMngsAccount/BotResponseMngsAccount';
import { BotResponseMngsCheckAccount } from '../Segments/Health/BotResponseMngsCheckAccount/BotResponseMngsCheckAccount';
import { BotDesignerResponseMedicalAppointment } from '../Segments/Health/BdHealth/BotDesignerMedicalAppointment';
import { BotDesignerResponseMedicalAppointmentReschedule } from '../Segments/Health/BdHealth/BotDesignerMedicalAppointmentReschedule';
import { BotDesignerPatientCreation } from '../Segments/Health/BdHealth/BotDesignerPatientCreation';
import { BotDesignerCheckAccount } from '../Segments/Health/BdHealth/BotDesignerCheckAccount';
import { BotResponseMngsCheckAppointment } from '../Segments/Health/BotResponseMngsCheckAppointment/BotResponseMngsCheckAppointment';
import { BotResponseConversationAssigned } from '../BotResponseConversationAssigned/BotResponseConversationAssigned';
import { BotDesignerAppointmentList } from '../Segments/Health/BdHealth/BotDesignerAppointmentList';
import { BotResponsePostBack } from '../BotResponsePostBack/BotResponsePostBack';
import { BotResponseTemplate } from '../BotResponseTemplate/BotResponseTemplate';
import { BotResponseComment } from '../BotResponseComment/BotResponseComment';
import { BotResponseCampaignEvent } from '../BotResponseCampaignEvent/BotResponseCampaignEvent';
import { BotDesignerMedicalScale } from '../Segments/Health/BdHealth/BotDesignerMedicalScale';
import { BotDesignerResponseResetMedicalAppointment } from '../Segments/Health/BdHealth/BotDesignerResetMedicalAppointment';
import { BotResponseReassignConversation } from '../BotResponseReassignConversation/BotResponseReassignConversation';
import { BotDesignerPatientIdentification } from '../Segments/Health/BdHealth/BotDesignerPatientIdentification';
import { BotResponseBDConfirmation } from '../Segments/Health/BdHealth/BotDesignerResponseConfirmation/BotDesignerResponseConfirmation';
import { BotDesignerReasonNotScheduling } from '../Segments/Health/BdHealth/BotDesignerReasonNotScheduling';
import { BotDesignerCheckDoctor } from '../Segments/Health/BdHealth/BotDesignerCheckDoctor';
import { BotDesignerDoctorSchedules } from '../Segments/Health/BdHealth/BotDesignerDoctorSchedules';
import { BotDesignerPatientRecoverPassword } from '../Segments/Health/BdHealth/BotDesignerPatientRecoverPassword';
import BotResponseTextV2 from '../BotResponseTextV2/BotResponseTextV2';
import { BotResponseText } from '../BotResponseText/BotResponseText';
import { connect } from 'react-redux';
import { BotSpaIntegrations } from '../bot-spa-integrations';
import { BotResponseBDRecoverLostSchedule } from '../Segments/Health/BdHealth/BotDesignerResponseRecoverLostSchedule/BotDesignerResponseRecoverLostSchedule';
import { BotResponseProtocol } from '../BotResponseProtocol';
import { BotResponseGenerativeAI } from '../BotResponseGenerativeAI';
import { BotDesignerValidateDoctor } from '../Segments/Health/BdHealth/BotDesignerValidateDoctor';
import { BotResponseGenerativeAIConv } from '../BotResponseGenerativeAIConv';
import { BotResponseWhatsappFlow } from '../BotResponseWhatsappFlow/BotResponseWhatsappFlow';
import { BotResponseSguOpenTitles } from '../Segments/Health/Sgu/SguOpenTitlesResponse/SguOpenTitlesResponse';

interface SettingsProps {
    settings: OrganizationSettings & { generalFeatureFlag: { [key: string]: any } };
}

class BotResponseFactoryClass extends Component<BotResponseProps & SettingsProps> {
    private getProps = () => {
        const key = this.props.response._id || this.props.response.id;
        return {
            key,
            onChange: this.props.onChange,
            submitted: this.props.submitted,
            response: this.props.response,
            onCreateAttribute: this.props.onCreateAttribute,
        };
    };

    private getResponse = () => {
        const props = this.getProps();

        switch (this.props.response.type) {
            case ResponseType.TEXT: {
                return this.props.settings.generalFeatureFlag?.v2Handlebars ? (
                    <BotResponseTextV2 {...props} />
                ) : (
                    <BotResponseText {...props} />
                );
            }
            case ResponseType.SET_ATTRIBUTE: {
                return <BotResponseSetAttribute {...props} />;
            }
            case ResponseType.CARD: {
                return <BotResponseCard {...props} />;
            }
            case ResponseType.WHATSAPP_FLOW: {
                return <BotResponseWhatsappFlow {...props} />;
            }
            case ResponseType.CAROUSEL: {
                return <BotResponseCarousel {...props} />;
            }
            case ResponseType.QUESTION: {
                return <BotResponseQuestion {...props} />;
            }
            case ResponseType.GOTO: {
                return <BotResponseGoto {...props} />;
            }
            case ResponseType.GOBACK: {
                return <BotResponseGoBack {...props} />;
            }
            case ResponseType.TAGS: {
                return <BotResponseTag {...props} />;
            }
            case ResponseType.IMAGE: {
                return <BotResponseImage {...props} />;
            }
            case ResponseType.VIDEO: {
                return <BotResponseVideo {...props} />;
            }
            case ResponseType.SWITCH_TEXT: {
                return <BotResponseSwitchText {...props} />;
            }
            case ResponseType.FAQ: {
                return <BotResponseFaq {...props} />;
            }
            case ResponseType.HTTP_HOOK: {
                return <BotResponseHttpHook {...props} />;
            }
            case ResponseType.QUICK_REPLY: {
                return <BotResponseQuickReply {...props} />;
            }
            case ResponseType.TRANSBOARD: {
                return <BotResponseTransboard {...props} />;
            }
            case ResponseType.CONVERSATION_ASSIGNED: {
                return <BotResponseConversationAssigned {...props} />;
            }
            case ResponseType.SET_RECOGNIZER_SCOPE: {
                return <BotResponseRecognizerScope {...props} />;
            }
            case ResponseType.STATUS_GUIA: {
                return <BotResponseStatusGuide {...props} />;
            }
            case ResponseType.GUIA_MEDICO: {
                return <BotResponseMedicalGuide {...props} />;
            }
            case ResponseType.PRINT_SCREEN: {
                return <BotResponsePrintScreen {...props} />;
            }
            case ResponseType.QR_BUSCA_FORNECEDOR: {
                return <BotResponseSearchSupplier {...props} />;
            }
            case ResponseType.QR_BUSCA_ID: {
                return <BotResponseSearchId {...props} />;
            }
            case ResponseType.GUIA_BENEFICIARIO: {
                return <BotResponseGuiaBeneficiario {...props} />;
            }
            case ResponseType.END_CONVERSATION: {
                return <BotResponseEndConversation {...props} />;
            }
            case 'MEDICAL_APPOINTMENT': {
                return <BotResponseMedicalAppointment {...props} />;
            }
            case 'MNGS_ACCOUNT': {
                return <BotResponseMngsAccount {...props} />;
            }
            case 'MNGS_CHECK_ACCOUNT': {
                return <BotResponseMngsCheckAccount {...props} />;
            }
            case 'MNGS_CHECK_APPOINTMENT': {
                return <BotResponseMngsCheckAppointment {...props} />;
            }
            case ResponseType.BOT_DESIGNER_CHECK_ACCOUNT: {
                return <BotDesignerCheckAccount {...props} />;
            }
            case ResponseType.BOT_DESIGNER_MEDICAL_APPOINTMENT: {
                return <BotDesignerResponseMedicalAppointment {...props} />;
            }
            case ResponseType.BOT_DESIGNER_PATIENT_CREATION: {
                return <BotDesignerPatientCreation {...props} />;
            }
            case ResponseType.BOT_DESIGNER_APPOINTMENT_LIST: {
                return <BotDesignerAppointmentList {...props} />;
            }
            case ResponseType.POST_BACK: {
                return <BotResponsePostBack {...props} />;
            }
            case ResponseType.TEMPLATE: {
                return <BotResponseTemplate {...props} />;
            }
            case ResponseType.COMMENT: {
                return <BotResponseComment {...props} />;
            }
            case ResponseType.CAMPAIGN_EVENT: {
                return <BotResponseCampaignEvent {...props} />;
            }
            case ResponseType.BOT_DESIGNER_MEDICAL_SCALE: {
                return <BotDesignerMedicalScale {...props} />;
            }
            case ResponseType.BOT_DESIGNER_VALIDATE_DOCTOR: {
                return <BotDesignerValidateDoctor {...props} />;
            }
            case ResponseType.BOT_DESIGNER_PATIENT_IDENTIFICATION: {
                return <BotDesignerPatientIdentification {...props} />;
            }
            case ResponseType.BOT_DESIGNER_REASON_FOR_NOT_SCHEDULING: {
                return <BotDesignerReasonNotScheduling {...props} />;
            }
            case ResponseType.BOT_DESIGNER_RESET_MEDICAL_APPOINTMENT: {
                return <BotDesignerResponseResetMedicalAppointment {...props} />;
            }
            case ResponseType.REASSIGN_CONVERSATION: {
                return <BotResponseReassignConversation {...props} />;
            }
            case ResponseType.BOT_DESIGNER_CONFIRMATION: {
                return <BotResponseBDConfirmation {...props} />;
            }
            case ResponseType.BOT_DESIGNER_CHECK_DOCTOR: {
                return <BotDesignerCheckDoctor {...props} />;
            }
            case ResponseType.BOT_DESIGNER_DOCTOR_SCHEDULES: {
                return <BotDesignerDoctorSchedules {...props} />;
            }
            case ResponseType.BOT_DESIGNER_APPOINTMENT_RESCHEDULE: {
                return <BotDesignerResponseMedicalAppointmentReschedule {...props} />;
            }
            case ResponseType.BOT_DESIGNER_RECOVER_PASSWORD: {
                return <BotDesignerPatientRecoverPassword {...props} />;
            }
            case ResponseType.BOT_DESIGNER_SAP_INTEGRATION: {
                return <BotSpaIntegrations {...props} />;
            }
            case ResponseType.BOT_DESIGNER_SAP_INTEGRATION_REMOVE: {
                return <BotSpaIntegrations {...props} />;
            }
            case ResponseType.BOT_DESIGNER_RECOVER_LOST_SCHEDULE: {
                return <BotResponseBDRecoverLostSchedule {...props} />;
            }
            case ResponseType.PROTOCOL: {
                return <BotResponseProtocol {...props} />;
            }
            case ResponseType.GENERATIVE_AI: {
                return <BotResponseGenerativeAI {...props} />;
            }
             case ResponseType.GENERATIVE_AI_CONV: {
                return <BotResponseGenerativeAIConv {...props} />;
            }
            case ResponseType.SGU_OPEN_TITLES: {
                return <BotResponseSguOpenTitles {...props} />;
            }
            default:
                return (<div>{this.props.response.type} - Not implemented yet.</div>) as any;
        }
    };
    render() {
        return <div className='factory'>{this.getResponse()}</div>;
    }
}
const mapStateToProps = (state: any) => ({
    settings: state.loginReducer.settings,
});

const BotResponseFactory = connect(mapStateToProps)(BotResponseFactoryClass);

export default I18n(BotResponseFactory);
