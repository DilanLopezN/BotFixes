import {
    UnauthorizedException,
    NotFoundException,
    BadRequestException,
    BadGatewayException,
    InternalServerErrorException,
    ConflictException,
    ForbiddenException,
    HttpException,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { errorCounter } from '../../common/utils/prom-metrics';

export class CustomBadRequestException extends BadRequestException {}
export class CustomForbiddenException extends ForbiddenException {}
export class CustomUnauthorizedException extends UnauthorizedException {}
export class CustomNotFoundException extends NotFoundException {}
export class CustomConflictException extends ConflictException {}
export class CustomBadGatewayException extends BadGatewayException {}
export class CustomInternalServerErrorException extends InternalServerErrorException {}

export const Exceptions = {
    CANNOT_SEND_MESSAGE_ON_NOT_ENABLED_CHANNEL: new CustomUnauthorizedException(
        'Channel config not enabled',
        'CANNOT_SEND_MESSAGE_ON_NOT_ENABLED_CHANNEL',
    ),
    INVALID_TOKEN: new CustomUnauthorizedException('Invalid token!', 'INVALID_TOKEN'),
    EXPIRED_TOKEN: new CustomUnauthorizedException('Expired token!', 'EXPIRED_TOKEN'),
    EXTERNAL_REQUEST_MISSING_WORKSPACE_ID: new CustomBadRequestException(
        'External request need to have workspace token',
        'EXTERNAL_REQUEST_MISSING_WORKSPACE_ID',
    ),
    INVALID_DATE_FILTER: new CustomBadRequestException('Invalid date filter!', 'INVALID_DATE_FILTER'),
    INVALID_RATING_TOKEN: new CustomUnauthorizedException('Invalid rating token!', 'INVALID_RATING_TOKEN'),
    INVALID_EMAIL: new CustomBadRequestException('Invalid email!', 'INVALID_EMAIL'),
    INVALID_USER: new CustomBadRequestException('Invalid user!', 'INVALID_USER'),
    USER_NOT_FOUND: new CustomNotFoundException('User not found!', 'USER_NOT_FOUND'),
    AUTHORIZATION_TOKEN_MUST_BE_PROVIDED: new CustomUnauthorizedException(
        'Authorization token must be provided!',
        'AUTHORIZATION_TOKEN_MUST_BE_PROVIDED',
    ),
    USER_CANT_ACCESS_RESOURCE: new CustomUnauthorizedException(
        'User cant acces this resource!',
        'USER_CANT_ACCESS_RESOURCE',
    ),
    BOT_NOT_FOUND: new CustomNotFoundException('Bot not found', 'BOT_NOT_FOUND'),
    BOT_FOR_CLONE_NOT_FOUND: new CustomNotFoundException('Bot for clone not found', 'BOT_FOR_CLONE_NOT_FOUND'),
    ENTITY_IN_USE: new CustomBadRequestException(`Entity is used in some interaction or attribute`, 'ENTITY_IN_USE'),
    INTERACTION_NOT_FOUND: new CustomNotFoundException('Interaction not found', 'INTERACTION_NOT_FOUND'),
    WELCOME_INTERACTION_NOT_FOUND: new CustomNotFoundException(
        'Welcome interaction not found',
        'WELCOME_INTERACTION_NOT_FOUND',
    ),
    FALLBACK_INTERACTION_NOT_FOUND: new CustomNotFoundException(
        'Fallback interaction not found',
        'FALLBACK_INTERACTION_NOT_FOUND',
    ),
    NOT_UNIQUE_CONTEXT_INTERACTION: new CustomConflictException(
        'Interaction must be unique in this context',
        'NOT_UNIQUE_CONTEXT_INTERACTION',
    ),
    CANNOT_DELETE_EMULATOR_CHANNEL_CONFIG: new CustomBadRequestException(
        'Cannot delete an channel config of type emulator',
        'CANNOT_DELETE_EMULATOR_CHANNEL_CONFIG',
    ),
    CANNOT_CREATE_ON_PARENT_REFERENCE: new CustomBadRequestException(
        'Cannot create interaction when parent is a reference',
        'CANNOT_CREATE_ON_PARENT_REFERENCE',
    ),
    CANNOT_DELETE_WELCOME_AND_FALLBACK: new CustomBadRequestException(
        'Interactions welcome or fallback cannot be deleted',
        'CANNOT_DELETE_WELCOME_AND_FALLBACK',
    ),
    WORKSPACE_ID_DONT_MATCH: new CustomBadRequestException("WorkspaceId don't match", 'WORKSPACE_ID_DONT_MATCH'),
    WORKSPACE_ID_DONT_MATCH_FOR_CLONE_BOT: new CustomBadRequestException(
        "WorkspaceId for clone bot don't match",
        'WORKSPACE_ID_DONT_MATCH_FROM_CLONE_BOT',
    ),
    IP_MIDDLEWARE_VALIDATION_FAILED: new CustomBadRequestException(
        'Client ip failed on access group validation',
        'IP_MIDDLEWARE_VALIDATION_FAILED',
    ),
    ORGANIZATION_NOT_FOUND: new CustomBadRequestException('Organization not found', 'ORGANIZATION_NOT_FOUND'),
    BAD_REQUEST: new CustomBadRequestException(''),
    BAD_GATEWAY: new CustomBadGatewayException(''),
    CANNOT_UPDATE_BOT_MEMBER: new CustomInternalServerErrorException(
        'Cannot comunicate with conversation manager to update bot member',
        'CANNOT_UPDATE_BOT_MEMBER',
    ),
    EMAIL_IN_USE: new CustomConflictException('This email is already in use.', 'EMAIL_IN_USE'),
    COGNITO_UNIQUE_ID_IN_USE: new CustomConflictException(
        'This cognitoUniqueId is already in use.',
        'COGNITO_UNIQUE_ID_IN_USE',
    ),
    NOT_FOUND: new CustomNotFoundException('Not found!', 'NOT_FOUND'),
    INVALID_CHANNELCONFIG: new CustomBadRequestException('Invalid channelconfigId!', 'INVALID_CHANNELCONFIG'),
    NOT_FOUND_CHANNELCONFIG: new CustomBadRequestException('Not found channelconfigId!', 'NOT_FOUND_CHANNELCONFIG'),
    INVALID_CREDENTIALS: new CustomBadRequestException('Invalid credentials!', 'INVALID_CREDENTIALS'),
    CONVERSATION_NOT_FOUND: new CustomNotFoundException('Conversation not found!', 'CONVERSATION_NOT_FOUND'),
    NO_PERMISSION_TO_ACESS_CONVERSATION: new CustomUnauthorizedException(
        'No permission to acess conversation!',
        'NO_PERMISSION_TO_ACESS_CONVERSATION',
    ),
    CONVERSATION_CLOSED: new CustomBadRequestException('Conversation closed!', 'CONVERSATION_CLOSED'),
    CONVERSATION_WORKSPACEID_MISMATCH: new CustomBadRequestException(
        'Conversation workspaceId mismatch!',
        'CONVERSATION_WORKSPACEID_MISMATCH',
    ),
    CANT_LEAVE_CONVERSATION: new CustomNotFoundException("Can't leave the conversation!.", 'CANT_LEAVE_CONVERSATION'),
    MEMBER_ALREADY_DISABLED: new CustomNotFoundException('Member is already disabled', 'MEMBER_ALREADY_DISABLED'),
    INEXISTENT_MEMBER: new CustomNotFoundException('Inexistent member', 'INEXISTENT_MEMBER'),
    NOTHING_TO_UPDATE: new CustomBadRequestException('Nothing to update', 'NOTHING_TO_UPDATE'),
    ALREADY_CLOSED: new CustomBadRequestException('Already closed', 'ALREADY_CLOSED'),
    ONLY_CAN_LIST_TEMPLATE_GROUP_OWNER: new CustomBadRequestException(
        'Only template group owner can list this dashboard',
        'ONLY_CAN_LIST_TEMPLATE_GROUP_OWNER',
    ),
    ONLY_CAN_UPDATE_DASHBOARD_OWNER: new CustomBadRequestException(
        'Only template group owner can update this dashboard',
        'ONLY_CAN_UPDATE_TEMPLATE_GROUP_OWNER',
    ),
    ONLY_CAN_UPDATE_TEMPLATE_GROUP_OWNER: new CustomBadRequestException(
        'Only template group owner can update this dashboard',
        'ONLY_CAN_UPDATE_TEMPLATE_GROUP_OWNER',
    ),
    INVALID_CREATE_BILLING_MONTH: new CustomBadRequestException(
        'Já existe um pagamento para o mês',
        'INVALID_CREATE_BILLING_MONTH',
    ),
    CANNOT_GET_MESSAGE_BY_EXTERNAL_ID_API_TOKEN: new CustomBadRequestException(
        'Invalid api token',
        'CANNOT_GET_MESSAGE_BY_EXTERNAL_ID_API_TOKEN',
    ),
    CANNOT_GET_ACTIVE_MESSAGES_INVALID_PERIOD: new CustomBadRequestException(
        'Invalid period to get active messages',
        'CANNOT_GET_ACTIVE_MESSAGES_INVALID_PERIOD',
    ),
    CANNOT_OPTIN_GUPSHUP_TEXT_MESSAGE: new CustomBadRequestException(
        'Cannot optin gupshup on sending template text message',
        'CANNOT_OPTIN_GUPSHUP_TEXT_MESSAGE',
    ),
    ACTIVE_MESSAGE_FEATURE_FLAG_NOT_ENABLED: new CustomBadRequestException(
        'Active message feature flag should be enabled to execute this action',
        'ACTIVE_MESSAGE_FEATURE_FLAG_NOT_ENABLED',
    ),
    CAMPAIGN_FEATURE_FLAG_NOT_ENABLED: new CustomBadRequestException(
        'Campaign feature flag should be enabled to execute this action',
        'CAMPAIGN_FEATURE_FLAG_NOT_ENABLED',
    ),
    AGENT_STATUS_FEATURE_FLAG_NOT_ENABLED: new CustomBadRequestException(
        'Agent status feature flag should be enabled to execute this action',
        'AGENT_STATUS_FEATURE_FLAG_NOT_ENABLED',
    ),
    AGENT_STATUS_NEEDED: new CustomBadRequestException(
        'At least one workspace break setting are needed to enable the agent status feature',
        'AGENT_STATUS_NEEDED',
    ),
    AGENT_STATUS_FEATURE_FLAG_FOR_AGENTS_NOT_ENABLED: new CustomBadRequestException(
        'Agent status feature flag should be enabled to execute this action',
        'AGENT_STATUS_FEATURE_FLAG_FOR_AGENTS_NOT_ENABLED',
    ),
    AGENT_STATUS_BREAK_ACTIVE: new CustomBadRequestException(
        'Agent cannot perform this action because they are currently on a break.',
        'AGENT_STATUS_BREAK_ACTIVE',
    ),
    NOT_FOUND_BREAK_SETTING: new CustomBadRequestException('Not found break setting.', 'NOT_FOUND_BREAK_SETTING'),
    CONFIRMATION_FEATURE_FLAG_NOT_ENABLED: new CustomBadRequestException(
        'Confirmation feature flag should be enabled to execute this action',
        'CONFIRMATION_FEATURE_FLAG_NOT_ENABLED',
    ),
    CANNOT_SEND_ACTIVE_MESSAGE_NOT_ENABLED: new CustomBadRequestException(
        'Cannot send active message on disabled integration',
        'CANNOT_SEND_ACTIVE_MESSAGE_NOT_ENABLED',
    ),
    CANNOT_SEND_ACTIVE_SCHEDULE_NOT_ENABLED: new CustomBadRequestException(
        'Cannot send active schedule on disabled integration',
        'CANNOT_SEND_ACTIVE_SCHEDULE_NOT_ENABLED',
    ),
    SPAM_SEND_MESSAGE_BY_API_KEY: new CustomBadRequestException(
        'SPAM_SEND_MESSAGE_BY_API_KEY',
        'SPAM_SEND_MESSAGE_BY_API_KEY',
    ),
    ERROR_SIZE_JSON_SCHEDULE: new CustomBadRequestException(
        'O tamanho do JSON "schedule" excede o limite permitido.',
        'ERROR_SIZE_JSON_SCHEDULE',
    ),
    ERROR_SIZE_JSON_CONTACT: new CustomBadRequestException(
        'O tamanho do JSON "contact" excede o limite permitido.',
        'ERROR_SIZE_JSON_CONTACT',
    ),
    NOT_WEBCHAT_WEBEMULATOR_CHANNEL_CONFIG: new CustomBadRequestException(
        'Should be webchat or webemulator channel config',
        'NOT_WEBCHAT_WEBEMULATOR_CHANNEL_CONFIG',
    ),
    CANNOT_GET_DASHBOARD_DATA_FOR_INVALID_TEMPLATE: new CustomBadRequestException(
        'Dashboard template is invalid',
        'CANNOT_GET_DASHBOARD_DATA_FOR_INVALID_TEMPLATE',
    ),
    FACEBOOK_CHANNEL_MISMATCH: new CustomBadRequestException(
        'Facebook channel cannot create conversation with channel config id mismatching',
        'FACEBOOK_CHANNEL_MISMATCH',
    ),
    INITIAL_SETUP_ALREADY_STARTED: new CustomBadRequestException(
        'Setup inicial já iniciado',
        'INITIAL_SETUP_ALREADY_STARTED',
    ),
    ERROR_CREATE_WORKSPACE_ON_SETUP: new CustomBadRequestException(
        'Não foi possivel criar o workspace no setup inicial',
        'ERROR_CREATE_WORKSPACE_ON_SETUP',
    ),
    CHANNEL_CONFIG_NOT_FOUND: new CustomBadRequestException(
        'Channel config not found with given token',
        'CHANNEL_CONFIG_NOT_FOUND',
    ),
    CHANNEL_CONFIG_APPNAME_ALREADY_EXISTS: new CustomBadRequestException(
        'Channel config appName already exists',
        'CHANNEL_CONFIG_APPNAME_ALREADY_EXISTS',
    ),
    CANNOT_CREATE_PAYMENT_GATEWAY_ON_NOT_OPENED_PAYMENT: new CustomBadRequestException(
        'CANNOT_CREATE_PAYMENT_GATEWAY_ON_NOT_OPENED_PAYMENT',
        'CANNOT_CREATE_PAYMENT_GATEWAY_ON_NOT_OPENED_PAYMENT',
    ),
    ERROR_NOT_FOUND_PAYMENT: new CustomBadRequestException('error not found payment', 'ERROR_NOT_FOUND_PAYMENT'),
    CANNOT_CREATE_PAYMENT_ITEM_INVALID_STATUS: new CustomBadRequestException(
        'cannot create payment item, invalid payment status',
        'CANNOT_CREATE_PAYMENT_ITEM_INVALID_STATUS',
    ),
    CANNOT_UPDATE_PAYMENT_ITEM_INVALID_STATUS: new CustomBadRequestException(
        'cannot update payment item, invalid payment status',
        'CANNOT_UPDATE_PAYMENT_ITEM_INVALID_STATUS',
    ),
    CANNOT_DELETE_PAYMENT_ITEM_INVALID_STATUS: new CustomBadRequestException(
        'cannot delete payment item, invalid payment status',
        'CANNOT_DELETE_PAYMENT_ITEM_INVALID_STATUS',
    ),
    CANNOT_START_INVALID_CAMPAIGN: new CustomBadRequestException(
        'Não é possivel iniciar. Campanha invalida',
        'CANNOT_START_INVALID_CAMPAIGN',
    ),
    CANNOT_START_INVALID_CAMPAIGN_INVALID_TEMPLATE: new CustomBadRequestException(
        'Não é possivel iniciar. Template invalido',
        'CANNOT_START_INVALID_CAMPAIGN_INVALID_TEMPLATE',
    ),
    CAMPAIGN_NOT_FOUND: new CustomBadRequestException('Não foi possivel encontrar a campanha', 'CAMPAIGN_NOT_FOUND'),
    CAMPAIGN_SENDED: new CustomBadRequestException('Campaign has already been sent', 'CAMPAIGN_SENDED'),
    CAMPAIGN_STARTED: new CustomBadRequestException('Campaign has already been started', 'CAMPAIGN_STARTED'),

    CAMPAIGN_SHOULD_AWAITING_SEND_PAUSED: new CustomBadRequestException(
        'Campanha deve estar como aguardando envio ou pausada',
        'CAMPAIGN_SHOULD_AWAITING_SEND_PAUSED',
    ),
    MISSING_CONTACT_ATTRIBUTES_FOR_IMMEDIATE_START: new CustomBadRequestException(
        'At least one contact does not have all the necessary attributes for immediate start.',
        'MISSING_CONTACT_ATTRIBUTES_FOR_IMMEDIATE_START',
    ),
    CANNOT_INVALID_FILE: new CustomBadRequestException('Arquivo inválido', 'CANNOT_INVALID_FILE'),
    ERROR_IN_FILE_SIZE_EXCEEDS_LIMIT: new CustomBadRequestException(
        'error in file size exceeds limit',
        'ERROR_IN_FILE_SIZE_EXCEEDS_LIMIT',
    ),
    CANNOT_CREATE_INVOICE_GATEWAY_ON_NOT_SYNCHRONIZED_PAYMENT: new CustomBadRequestException(
        'Pagamento não sincronizado no gateway',
        'CANNOT_CREATE_INVOICE_GATEWAY_ON_NOT_SYNCHRONIZED_PAYMENT',
    ),
    INVALID_RATING_RANGE: new CustomBadRequestException(
        'Invalid rating range. rating should be between 1 and 5',
        'INVALID_RATING_RANGE',
    ),
    ERROR_CREATE_ACCOUNT_ON_SETUP: new CustomBadRequestException(
        'Invalid account creation on initial setup',
        'ERROR_CREATE_ACCOUNT_ON_SETUP',
    ),
    EXTERNAL_REQUEST_MISSING_CONVERSATION_ID: new CustomBadRequestException(
        'External request need to have conversation token',
        'EXTERNAL_REQUEST_MISSING_CONVERSATION_ID',
    ),
    CANNOT_ASSUME_WITH_RATING: new CustomBadRequestException(
        'Cannot assume conversation when await rating',
        'CANNOT_ASSUME_WITH_RATING',
    ),
    CANNOT_BLOCK_ON_THIS_CHANNEL: new CustomBadRequestException(
        'Cannot block contact on this channel',
        'CANNOT_ASSUME_WITH_RATING',
    ),
    RATING_SETTING_ALREADY_EXISTS: new CustomBadRequestException(
        'Rating setting already exists',
        'RATING_SETTING_ALREADY_EXISTS',
    ),
    USER_NOT_FOUND_BY_PASSWORD: new CustomBadRequestException(
        'User not found by password and email',
        'USER_NOT_FOUND_BY_PASSWORD',
    ),
    USER_NOT_EXISTS_METHOD: new CustomBadRequestException('User not exists method login', 'USER_NOT_EXISTS_METHOD'),
    USER_EMPTY_COGNITO_ID: new CustomBadRequestException('User empty cognito id', 'USER_EMPTY_COGNITO_ID'),
    USER_CANNOT_SIGNIN_IDP: new CustomBadRequestException(
        'This user user cannot sign in using given identity provider',
        'USER_CANNOT_SIGNIN_IDP',
    ),
    USER_CANNOT_SIGNIN_WITH_SSO: new CustomBadRequestException(
        'This user user cannot sign in using SSO',
        'USER_CANNOT_SIGNIN_WITH_SSO',
    ),
    SSO_WORKSPACE_NOT_FOUND: new CustomBadRequestException(
        'Login with SSO should exists an sso setting',
        'SSO_WORKSPACE_NOT_FOUND',
    ),
    SSO_NAME_NOT_PROPERLY_SET: new CustomBadRequestException(
        'SSO name not properly set on workspace setting',
        'SSO_NAME_NOT_PROPERLY_SET',
    ),
    TAG_ALREADY_EXISTS_IN_CONVERSATION: new CustomBadRequestException(
        'Tag já existe na conversa',
        'TAG_ALREADY_EXISTS_IN_CONVERSATION',
    ),
    DISABLED_MEMBER_CANNOT_SEND_MESSAGE: new CustomBadRequestException(
        'Membros desabilitados não podem enviar mensagens',
        'DISABLED_MEMBER_CANNOT_SEND_MESSAGE',
    ),
    CHANNEL_NOT_LOGGED: new CustomBadRequestException('Canal não está conectado no momento', 'CHANNEL_NOT_LOGGED'),
    CHANNEL_NOT_LOGGED_ACTIVE_MESSAGE: new CustomBadRequestException(
        'Canal para envio de mensagem ativa não está conectado no momento',
        'CHANNEL_NOT_LOGGED_ACTIVE_MESSAGE',
    ),
    IP_NOT_ALLOWED: new CustomBadRequestException('Ip not allowed for this workspace and user', 'IP_NOT_ALLOWED'),
    ONLY_WHATSWEB_CAN_START_CALLBACK_CONVERSATION: new CustomBadRequestException(
        'This action can do only on whatsweb',
        'ONLY_WHATSWEB_CAN_START_CALLBACK_CONVERSATION',
    ),
    VALIDATE_CHANNEL_CONFIG_NOT_FOUND: new CustomBadRequestException(
        'No one validate channel config is available',
        'VALIDATE_CHANNEL_CONFIG_NOT_FOUND',
    ),
    VALIDATE_CHANNEL_CONFIG_NOT_FOUND_ACTIVE_MESSAGE: new CustomBadRequestException(
        'Nenhum canal encontrado para validação',
        'VALIDATE_CHANNEL_CONFIG_NOT_FOUND_ACTIVE_MESSAGE',
    ),
    WORKSPACEID_MISMATCH: new CustomBadRequestException('workspaceId mismatch', 'WORKSPACEID_MISMATCH'),
    ONLY_OPEN_CONVERSATION_CAN_BE_SUSPENDED: new CustomBadRequestException(
        'Only open conversations can be suspended',
        'ONLY_OPEN_CONVERSATION_CAN_BE_SUSPENDED',
    ),
    TEAM_NOT_FOUND: new CustomNotFoundException('Team not found', 'TEAM_NOT_FOUND'),
    TEAM_CANNOT_RECEIVE_CONVERSATION_TRANSFER: new CustomNotFoundException(
        'Team cannot receive conversation transfer',
        'TEAM_CANNOT_RECEIVE_CONVERSATION_TRANSFER',
    ),
    TEAM_INACTIVATED: new CustomNotFoundException('The team is inactive', 'TEAM_INACTIVATED'),
    ERROR_DELETE_TEAM_EXIST_OPENED_CONVERSATIONS: new CustomNotFoundException(
        'Error on delete team, exist opened conversations',
        'ERROR_DELETE_TEAM_EXIST_OPENED_CONVERSATIONS',
    ),
    USER_NOT_ON_TEAM: new CustomBadRequestException('User dont belong to given team', 'USER_NOT_ON_TEAM'),
    USER_NOT_HAVE_PERMISSION_ON_TEAM: new CustomBadRequestException(
        'The user does not have permission to take on attendances in this team',
        'USER_NOT_HAVE_PERMISSION_ON_TEAM',
    ),
    HEALTH_ENTITY_NOT_FOUND: new CustomBadRequestException('Health entity not found', 'HEALTH_ENTITY_NOT_FOUND'),
    ONLY_USER_HEALTH_ENTITY_CAN_BE_DELETED: new CustomBadRequestException(
        'Only health entity with source=user can be deleted',
        'ONLY_USER_HEALTH_ENTITY_CAN_BE_DELETED',
    ),
    WHATSAPP_CONVERSATION_EXPIRED: new CustomBadRequestException(
        'Whatsapp conversation expired, needs to send an hsm template message',
        'WHATSAPP_CONVERSATION_EXPIRED',
    ),
    TEMPLATE_MESSAGE_NOT_FOUND: new CustomBadRequestException(
        'Template message not found',
        'TEMPLATE_MESSAGE_NOT_FOUND',
    ),
    TEMPLATE_MESSAGE_STATUS_INVALID: new CustomBadRequestException(
        'Template message status invalid',
        'TEMPLATE_MESSAGE_STATUS_INVALID',
    ),
    TEMPLATE_HSM_REQUIRED: new CustomBadRequestException(
        'Required hsm template to send activity',
        'TEMPLATE_HSM_REQUIRED',
    ),
    DISABLED_MEMBER: new CustomBadRequestException('Disabled member', 'DISABLED_MEMBER'),
    DONT_PARTICIPATE_IN_THE_CONVERSATION: new CustomBadRequestException(
        "don't participate in this conversation",
        'DONT_PARTICIPATE_IN_THE_CONVERSATION',
    ),
    USER_CANNOT_UPDATE_ROLE: new CustomBadRequestException(
        "Your user can't update this role",
        'USER_CANNOT_UPDATE_ROLE',
    ),
    USER_CANNOT_DELETE_ROLE: new CustomBadRequestException(
        "Your user can't delete this role",
        'USER_CANNOT_DELETE_ROLE',
    ),
    EVENT_CANNOT_BE_SENDED: new CustomBadRequestException('This event cannot be sended', 'EVENT_CANNOT_BE_SENDED'),
    CHANNEL_CONFIG_EVENT_NOT_VALID: new CustomBadRequestException(
        'Channel not valid for this channel',
        'CHANNEL_CONFIG_EVENT_NOT_VALID',
    ),
    DUPLICATED_TAG: new CustomConflictException('Duplicated tag'),
    DUPLICATED_CONTEXT_VARIABLE: new CustomConflictException('Duplicated context variable'),
    ATTRIBUTE_ALREADY_EXISTS: new CustomConflictException('Attribute already exists'),
    DUPLICATED_ITEMS_INTERACTIONID: new CustomConflictException('found duplicate items in interactionId'),
    CANNOT_DELETE_ATTRIBUTE_IN_USE: new CustomBadRequestException(
        'Cannot delete attribute in use',
        'CANNOT_DELETE_ATTRIBUTE_IN_USE',
    ),
    INACTIVE_USER: new CustomUnauthorizedException('Inactive user', 'INACTIVE_USER'),
    NOT_ALLOWED_TO_TRANSFER_CONVERSATIONS: new CustomUnauthorizedException(
        'Not allowed to transfer conversations',
        'NOT_ALLOWED_TO_TRANSFER_CONVERSATIONS',
    ),
    PASSWORD_EXPIRED: new CustomForbiddenException('Expired password', 'PASSWORD_EXPIRED'),
    ACCOUNT_HAS_OPENED_BILLING: new CustomBadRequestException(
        'Account has an opened billing',
        'ACCOUNT_HAS_OPENED_BILLING',
    ),
    NOT_FINDED_SETTING_TYPE_MANUAL_EXTRACT: new CustomBadRequestException(
        'Not setting was found, cannot run manual extract',
        'NOT_FINDED_SETTING_TYPE_MANUAL_EXTRACT',
    ),
    CANNOT_START_CONVERSATION_ON_BLOCKED_CONTACT: new CustomBadRequestException(
        'Cannot start conversation on blocked contact',
        'CANNOT_START_CONVERSATION_ON_BLOCKED_CONTACT',
    ),
    CANNOT_BLOCK_NOT_FOUND_CONTACT: new CustomBadRequestException(
        'Cannot block not found contact',
        'CANNOT_BLOCK_NOT_FOUND_CONTACT',
    ),
    CANNOT_CREATE_BLOCK_CONTACT: new CustomBadRequestException(
        'Cannot create block contact',
        'CANNOT_CREATE_BLOCK_CONTACT',
    ),
    CANNOT_SEND_TEMPLATE_TYPE: new CustomBadRequestException(
        'Should be a document template',
        'CANNOT_SEND_TEMPLATE_TYPE',
    ),
    TEMPLATE_NOT_FOUND_FILE_UPLOAD: new CustomBadRequestException(
        'No tempalte found on file upload template',
        'TEMPLATE_NOT_FOUND_FILE_UPLOAD',
    ),
    CANNOT_GET_CONFIRM_LIST_FROM_INTEGRATIONS: new CustomBadRequestException(
        'Integration returned not iterable for confirmation',
        'CANNOT_GET_CONFIRM_LIST_FROM_INTEGRATIONS',
    ),
    CANNOT_STOP_INVALID_CAMPAIGN: new CustomBadRequestException(
        'Cannot stop invalid campaign',
        'CANNOT_STOP_INVALID_CAMPAIGN',
    ),
    ASAAS_GET_PAYMENT_ID_INVALID: new CustomBadRequestException(
        'Invalid id parameter asaas get payment',
        'ASAAS_GET_PAYMENT_ID_INVALID',
    ),
    WORKSPACE_DONT_BELONGS_TO_ACCOUNT: new CustomBadRequestException(
        'Workspace dont belongs to given workspace',
        'WORKSPACE_DONT_BELONGS_TO_ACCOUNT',
    ),
    PLAN_MESSAGE_PRICE_EMPTY: new CustomBadRequestException(
        'planMessagePrice field cannot be empty',
        'PLAN_MESSAGE_PRICE_EMPTY',
    ),
    PLAN_HSM_MESSAGE_PRICE_EMPTY: new CustomBadRequestException(
        'planHsmMessagePrice field cannot be empty',
        'PLAN_HSM_MESSAGE_PRICE_EMPTY',
    ),
    PLAN_EXCEEDED_MESSAGE_PRICE_EMPTY: new CustomBadRequestException(
        'planExceededMessagePrice field cannot be empty',
        'PLAN_EXCEEDED_MESSAGE_PRICE_EMPTY',
    ),
    CONVERSATION_WITHOUT_DESTINATION: new CustomBadRequestException(
        'it is not possible to create a conversation without a destination',
        'CONVERSATION_WITHOUT_DESTINATION',
    ),
    MEMBER_NOT_IN_CONVERSATION: new CustomBadRequestException(
        'member is not in conversation',
        'MEMBER_NOT_IN_CONVERSATION',
    ),
    MEMBER_ACTIVE_IN_CONVERSATION: new CustomBadRequestException(
        'member is already active in the conversation',
        'MEMBER_ACTIVE_IN_CONVERSATION',
    ),
    MEMBER_WITHOUT_PERMISSION: new CustomBadRequestException('member without permission', 'MEMBER_WITHOUT_PERMISSION'),
    INVALID_INTERACTIONS_TO_CLONE: new CustomBadRequestException(
        'no interaction available to clone',
        'INVALID_INTERACTIONS_TO_CLONE',
    ),
    INVALID_TARGET_INTERACTION_TO_CLONE: new CustomBadRequestException(
        'interaction not available to clone',
        'INVALID_INTERACTIONS_TO_CLONE',
    ),
    WITHOUT_PERMISSION: new CustomBadRequestException('without permission', 'WITHOUT_PERMISSION'),
    CANT_PUBLISH_PRODUCTION_FLOWS: new CustomBadRequestException(
        'the homologation version has not been published yet',
        'CANT_PUBLISH_PRODUCTION_FLOWS',
    ),
    CANT_PUBLISH_PRODUCTION_FLOWS_NEW_HOMOLOG_VERSION: new CustomBadRequestException(
        'the new homologation version has not been published yet',
        'CANT_PUBLISH_PRODUCTION_FLOWS',
    ),
    NO_DATA_TO_PUBLISH: new CustomBadRequestException('no new data to publish', 'NO_DATA_TO_PUBLISH'),
    CANT_SYNC_ALL_ENTITIES_DISABLED: new CustomBadRequestException(
        'Cant sync. All entities disabled',
        'CANT_SYNC_ALL_ENTITIES_DISABLED',
    ),
    NO_DATA_TO_SYNC: new CustomBadRequestException('no new data to sync', 'NO_DATA_TO_SYNC'),
    WORKSPACE_IS_ACTIVE: new CustomBadRequestException(
        'the workspace is activated, it is not possible to close',
        'WORKSPACE_IS_ACTIVE',
    ),
    WORKSPACE_IS_INACTIVE: new CustomBadRequestException('the workspace is deactivated', 'WORKSPACE_IS_INACTIVE'),
    WORKSPACE_DOES_NOT_HAVE_DIALOGFLOW_ACCOUNT: new CustomBadRequestException(
        'workspace does not have dialogFlow Account',
        'WORKSPACE_DOES_NOT_HAVE_DIALOGFLOW_ACCOUNT',
    ),
    TEMPLATE_MESSAGE_LENGTH_EXCEED: new CustomBadRequestException(
        'template message length exceed',
        'TEMPLATE_MESSAGE_LENGTH_EXCEED',
    ),
    TEMPLATE_FOOTER_MESSAGE_LENGTH_EXCEED: new CustomBadRequestException(
        'template message length exceed',
        'TEMPLATE_MESSAGE_LENGTH_EXCEED',
    ),
    TEMPLATE_MESSAGE_MIN_LENGTH: new CustomBadRequestException(
        'template message length min 10 character',
        'TEMPLATE_MESSAGE_MIN_LENGTH',
    ),
    TEMPLATE_BUTTONS_LENGTH_EXCEED: new CustomBadRequestException(
        'template buttons length exceed, max 3 buttons of type quick_reply',
        'TEMPLATE_BUTTONS_LENGTH_EXCEED',
    ),
    TEMPLATE_INVALID_BUTTON_TYPE: new CustomBadRequestException(
        'Invalid button type in category of template',
        'TEMPLATE_INVALID_BUTTON_TYPE',
    ),
    TEMPLATE_FILE_INVALID_BUTTON_QTD: new CustomBadRequestException(
        'A file template cannot have more than 3 buttons when it is not an HSM',
        'TEMPLATE_FILE_INVALID_BUTTON_QTD',
    ),
    TEMPLATE_BUTTONS_VARIABLES_LENGTH_EXCEED: new CustomBadRequestException(
        'It is only possible to add 1 variable to a URL type button',
        'TEMPLATE_BUTTONS_VARIABLES_LENGTH_EXCEED',
    ),
    TEMPLATE_BUTTONS_VARIABLES_INVALID_TEXT: new CustomBadRequestException(
        'URL type button variable text is invalid',
        'TEMPLATE_BUTTONS_VARIABLES_INVALID_TEXT',
    ),
    TEMPLATE_BUTTONS_VARIABLES_INVALID_POSITION: new CustomBadRequestException(
        'URL type button variable position is invalid',
        'TEMPLATE_BUTTONS_VARIABLES_INVALID_POSITION',
    ),
    TEMPLATE_BUTTONS_VARIABLES_MANDATORY_EXAMPLE: new CustomBadRequestException(
        'URL type button variable mandatory example',
        'TEMPLATE_BUTTONS_VARIABLES_MANDATORY_EXAMPLE',
    ),
    TEMPLATE_BUTTONS_TEXT_LENGTH_ERROR: new CustomBadRequestException(
        'Button text does not fit within defined limits, (min: 1, max: 20)',
        'TEMPLATE_BUTTONS_TEXT_LENGTH_ERROR',
    ),
    ERROR_UPDATE_TEMPLATE_MESSAGE_HSM: new CustomBadRequestException(
        'It is not possible to update message in isHsm template',
        'ERROR_UPDATE_TEMPLATE_MESSAGE_HSM',
    ),
    ERROR_SYNC_TEMPLATE_MESSAGE: new CustomBadRequestException(
        'ERROR_SYNC_TEMPLATE_MESSAGE',
        'ERROR_SYNC_TEMPLATE_MESSAGE',
    ),
    TEMPLATE_MESSAGE_INVALID: new CustomBadRequestException('template message invalid', 'TEMPLATE_MESSAGE_INVALID'),
    TEMPLATE_VARIABLES_INVALID: new CustomBadRequestException(
        'template variables invalid',
        'TEMPLATE_VARIABLES_INVALID',
    ),
    TEMPLATE_NOT_EXIST: new CustomBadRequestException('template not exist', 'TEMPLATE_NOT_EXIST'),
    TEMPLATE_CANNOT_BE_EDITED: new CustomBadRequestException('template cannot be edited', 'TEMPLATE_CANNOT_BE_EDITED'),
    TEMPLATE_CHANNEL_APPNAME_NOT_FOUND: new CustomBadRequestException(
        'template channel appName not found',
        'TEMPLATE_CHANNEL_APPNAME_NOT_FOUND',
    ),
    ERROR_CREATE_TEMPLATE: new CustomBadRequestException('Error creation template', 'ERROR_CREATE_TEMPLATE'),
    TEMPLATE_IN_USE: new CustomBadRequestException('Template is in use', 'TEMPLATE_IN_USE'),
    GUPSHUP_APPNAME_NOT_FOUND: new CustomBadRequestException('gupshup appName not found', 'GUPSHUP_APPNAME_NOT_FOUND'),
    ERROR_PHONE_AUTO_ASSIGN_CONVERSATION: new CustomBadRequestException(
        'phone has already been registered',
        'ERROR_PHONE_AUTO_ASSIGN_CONVERSATION',
    ),
    ERROR_CONTACT_AUTO_ASSIGN_CONVERSATION: new CustomBadRequestException(
        'auto sign already has a contact linked',
        'ERROR_CONTACT_AUTO_ASSIGN_CONVERSATION',
    ),
    CONTACT_NOT_FOUND: new CustomBadRequestException('contact not found', 'CONTACT_NOT_FOUND'),
    ERROR_DUPLICATED_CHANNEL_CONFIG_PRIVACY_POLICY: new CustomBadRequestException(
        'privacy policy already has a channelConfig linked',
        'ERROR_DUPLICATED_CHANNEL_CONFIG_PRIVACY_POLICY',
    ),
    ERROR_ACTION_USED_ON_INTERACTION: new CustomBadRequestException(
        'error action used on interaction',
        'ERROR_ACTION_USED_ON_INTERACTION',
    ),
    ERROR_DISABLED_INTEGRATION: new CustomBadRequestException(
        'error disabled integration',
        'ERROR_DISABLED_INTEGRATION',
    ),
    ERROR_INTEGRATION_NOT_FOUND: new CustomBadRequestException(
        'error integration not found',
        'ERROR_INTEGRATION_NOT_FOUND',
    ),
    ERROR_IMPORT_ENTITIES_INTEGRATION: new CustomBadRequestException(
        'the import of entities is already being executed',
        'ERROR_IMPORT_ENTITIES_INTEGRATION',
    ),
    ERROR_INTENT_NOT_FOUND: new CustomBadRequestException(
        'error intent not found in workspace',
        'ERROR_INTENT_NOT_FOUND',
    ),
    ERROR_NO_MATCH_FIELD_SCHEDULE_FILTER: new CustomBadRequestException(
        'error no match field schedule filter',
        'ERROR_NO_MATCH_FIELD_SCHEDULE_FILTER',
    ),
    ERROR_RUNNER_NOT_FOUND: new CustomBadRequestException('error runner not found', 'ERROR_RUNNER_NOT_FOUND'),
    ERROR_RUNNER_SERVICE_NOT_FOUND: new CustomBadRequestException(
        'error runner service not found',
        'ERROR_RUNNER_SERVICE_NOT_FOUND',
    ),
    ERROR_CREATE_RUNNER_SERVICE_NOT_FOUND: new CustomBadRequestException(
        'error create runner service not found',
        'ERROR_CREATE_RUNNER_SERVICE_NOT_FOUND',
    ),
    ERROR_RUNNER_SERVICE_FIELD_ENV_IN_USE: new CustomBadRequestException(
        'error runner service field env in use',
        'ERROR_RUNNER_SERVICE_FIELD_ENV_IN_USE',
    ),
    ERROR_IN_PROCESS_CREATE_CONVERSATION: new CustomBadRequestException(
        'error in the conversation creation process',
        'ERROR_IN_PROCESS_CREATE_CONVERSATION',
    ),
    OFFLINE_INTEGRATION: new CustomBadRequestException('integration offline', 'OFFLINE_INTEGRATION'),
    ALREADY_PUBLISHING_ENTITIES: new CustomBadRequestException(
        'already publishing entities',
        'ALREADY_PUBLISHING_ENTITIES',
    ),
    ERROR_MANDATORY_PERIOD_TO_DOWNLOAD: new CustomBadRequestException(
        'ERROR_MANDATORY_PERIOD_TO_DOWNLOAD',
        'MANDATORY ERROR PERIOD TO DOWNLOAD',
    ),
    ERROR_MAX_PERIOD: new CustomBadRequestException('ERROR_MAX_PERIOD', 'ERROR SELECT A PERIOD OF MAX 3 MONTHS'),
    CAMPAIGN_CONTACTS_LIMIT_EXCEEDED: new CustomBadRequestException(
        'Contacts limit has been exceeded',
        'CONTACTS_LIMIT_EXCEEDED',
    ),
    ACTIVE_MESSAGE_SETTINGS_NOT_FOUND: new CustomBadRequestException(
        'Active Message Settings not found',
        'ACTIVE_MESSAGE_SETTINGS_NOT_FOUND',
    ),
    ACTIVE_MESSAGE_SETTINGS_NOT_ENABLED: new CustomBadRequestException(
        'Active Message Settings not enabled',
        'ACTIVE_MESSAGE_SETTINGS_NOT_ENABLED',
    ),
    CAMPAIGN_SEND_AT_MUST_BE_FUTURE: new CustomBadRequestException(
        'sendAt must be future',
        'CAMPAIGN_SEND_AT_MUST_BE_FUTURE',
    ),
    CAMPAIGN_IMMEDIATE_START_AND_SEND_AT_SUPPLIED: new CustomBadRequestException(
        'immediateStart and sendAt supplied',
        'CAMPAIGN_IMMEDIATE_START_AND_SEND_AT_SUPPLIED',
    ),
    CAMPAIGN_CANNOT_START_WITH_NO_CONTACTS: new CustomBadRequestException(
        'Campaign cannot start with no contacts',
        'CAMPAIGN_CANNOT_START_WITH_NO_CONTACTS',
    ),
    CONTEXT_AI_INVALID_QUESTION: new CustomBadRequestException(
        'CONTEXT_AI_INVALID_QUESTION',
        'CONTEXT_AI_INVALID_QUESTION',
    ),
    WORKSPACE_NOT_FOUND: new CustomBadRequestException('Workspace not found', 'WORKSPACE_NOT_FOUND'),
    SPAM_SEND_MESSAGE_BY_TOKEN: new CustomBadRequestException(
        'SPAM_SEND_MESSAGE_BY_TOKEN',
        'SPAM_SEND_MESSAGE_BY_TOKEN',
    ),
    EMAIL_SENDING_SETTING_NOT_FOUND: new CustomBadRequestException(
        'EMAIL_SENDING_SETTING_NOT_FOUND',
        'EMAIL_SENDING_SETTING_NOT_FOUND',
    ),
    TEMPLATE_EMAIL_NOT_FOUND: new CustomBadRequestException('TEMPLATE_EMAIL_NOT_FOUND', 'TEMPLATE_EMAIL_NOT_FOUND'),
    TEMPLATE_EMAIL_VERSION_NOT_FOUND: new CustomBadRequestException(
        'TEMPLATE_EMAIL_VERSION_NOT_FOUND',
        'TEMPLATE_EMAIL_VERSION_NOT_FOUND',
    ),
    CANNOT_DOWNLOAD_THE_FILE_WHEN_CONVERSATION_IS_NOT_CLOSED: new CustomBadRequestException(
        'Cannot download the file when conversation is not closed',
        'CANNOT_DOWNLOAD_THE_FILE_WHEN_CONVERSATION_IS_NOT_CLOSED',
    ),
    AUDIO_TRANSCRIPTION_FEATURE_FLAG_NOT_ENABLED: new CustomBadRequestException(
        'Audio transcription feature flag should be enabled to execute this action',
        'AUDIO_TRANSCRIPTION_FEATURE_FLAG_NOT_ENABLED',
    ),
    ACTIVITY_NOT_FOUND: new CustomBadRequestException('ACTIVITY_NOT_FOUND', 'ACTIVITY_NOT_FOUND'),
    INVALID_TYPE_ACTIVITY: new CustomBadRequestException('INVALID_TYPE_ACTIVITY', 'INVALID_TYPE_ACTIVITY'),
    INVALID_TYPE_REACTION_MESSAGE: new CustomBadRequestException(
        'INVALID_TYPE_REACTION_MESSAGE',
        'INVALID_TYPE_REACTION_MESSAGE',
    ),
    ERROR_MISSING_MANDATORY_FIELD: new CustomBadRequestException(
        'ERROR_MISSING_MANDATORY_FIELD',
        'ERROR_MISSING_MANDATORY_FIELD',
    ),
    INVALID_ACTIVITY_AUDIO_TRANSCRIPTION: new CustomBadRequestException(
        'INVALID_ACTIVITY_AUDIO_TRANSCRIPTION',
        'INVALID_ACTIVITY_AUDIO_TRANSCRIPTION',
    ),
    INVALID_FILE_TYPE_AUDIO_TRANSCRIPTION: new CustomBadRequestException(
        'Tipo de arquivo não suportado.',
        'INVALID_FILE_TYPE_AUDIO_TRANSCRIPTION',
    ),
    FILE_SIZE_EXCEED_AUDIO_TRANSCRIPTION: new CustomBadRequestException(
        'O arquivo excede o limite de 10 MB.',
        'FILE_SIZE_EXCEED_AUDIO_TRANSCRIPTION',
    ),
    ALREADY_EXIST_AUDIO_TRANSCRIPTION: new CustomBadRequestException(
        'ALREADY_EXIST_AUDIO_TRANSCRIPTION',
        'ALREADY_EXIST_AUDIO_TRANSCRIPTION',
    ),
    TRANSCRIPTION_IS_ALREADY_BEING_DONE: new CustomBadRequestException(
        'TRANSCRIPTION_IS_ALREADY_BEING_DONE',
        'TRANSCRIPTION_IS_ALREADY_BEING_DONE',
    ),
    INTERACTION_IS_NOT_PUBLISHED: new CustomBadRequestException(
        'Interactions is not published',
        'INTERACTION_IS_NOT_PUBLISHED',
    ),
    CONVERSATION_SMT_RE_ALREADY_SET: new CustomBadRequestException(
        'Conversation already has smart reengagement configured',
        'CONVERSATION_SMT_RE_ALREADY_SET',
    ),
    CONVERSATION_SMT_RE_NOT_CONFIGURED: new CustomBadRequestException(
        'Conversation does not have smart reengagement configured',
        'CONVERSATION_SMT_RE_NOT_CONFIGURED',
    ),
    CONVERSATION_OUTCOME_NOT_FOUND: new CustomBadRequestException(
        'Conversation outcome not found',
        'CONVERSATION_OUTCOME_NOT_FOUND',
    ),
    CONVERSATION_OBJECTIVE_NOT_FOUND: new CustomBadRequestException(
        'Conversation objective not found',
        'CONVERSATION_OBJECTIVE_NOT_FOUND',
    ),
    TEAM_REQUIRES_CONVERSATION_CATEGORIZATION: new CustomBadRequestException(
        'Team requires conversation categorization',
        'TEAM_REQUIRES_CONVERSATION_CATEGORIZATION',
    ),
    CONVERSATION_CATEGORIZATION_REQUIRED: new CustomBadRequestException(
        'Conversation categorization required when it has a description, objective or outcome',
        'CONVERSATION_CATEGORIZATION_REQUIRED',
    ),
    CONVERSATION_CATEGORIZATION_NOT_FOUND: new CustomBadRequestException(
        'Conversation categorization_not found',
        'CONVERSATION_CATEGORIZATION_NOT_FOUND',
    ),
    CONVERSATION_OBJECTIVE_NAME_ALREADY_EXISTS: new CustomBadRequestException(
        'A conversation objective with the same name already exists',
        'CONVERSATION_OBJECTIVE_NAME_ALREADY_EXISTS',
    ),
    CONVERSATION_OUTCOME_NAME_ALREADY_EXISTS: new CustomBadRequestException(
        'A conversation outcome with the same name already exists',
        'CONVERSATION_OUTCOME_NAME_ALREADY_EXISTS',
    ),
    WORKSPACE_CONVERSATION_CATEGORIZATION_DISABLED: new CustomBadRequestException(
        'Workspace conversation categorization disabled',
        'WORKSPACE_CONVERSATION_CATEGORIZATION_DISABLED',
    ),
    CONVERSATION_CATEGORIZATION_ALREADY_EXISTS: new CustomBadRequestException(
        'Conversation categorization with this workspace and conversation already exists',
        'CONVERSATION_CATEGORIZATION_ALREADY_EXISTS',
    ),
    CONVERSATION_OBJECTIVE_AND_OUTCOME_NEEDED: new CustomBadRequestException(
        'At least one workspace conversation objective and one outcome are needed to enable the conversation categorization feature',
        'CONVERSATION_OBJECTIVE_AND_OUTCOME_NEEDED',
    ),
    USER_EMAIL_NOT_VERIFIED: new CustomBadRequestException(
        'User email has not been verified',
        'USER_EMAIL_NOT_VERIFIED',
    ),
    USER_IS_NOT_ANY_WS_ADMIN: new CustomBadRequestException(
        'User is not a workspace admin of any workspace',
        'USER_IS_NOT_ANY_WS_ADMIN',
    ),
    PASSWORD_RESET_REQUEST_NOT_FOUND: new CustomBadRequestException(
        'Password reset request not found or password has already been reset',
        'PASSWORD_RESET_REQUEST_NOT_FOUND',
    ),
    MAIL_RESET_REQUEST_NOT_FOUND: new CustomBadRequestException(
        'Mail reset request not found or mail has already been reset',
        'MAIL_RESET_REQUEST_NOT_FOUND',
    ),
    PASSWORD_RESET_REQUEST_EXPIRED: new CustomBadRequestException(
        'Password reset request has already expired',
        'PASSWORD_RESET_REQUEST_EXPIRED',
    ),
    MAIL_RESET_REQUEST_EXPIRED: new CustomBadRequestException(
        'Mail reset request has already expired',
        'MAIL_RESET_REQUEST_EXPIRED',
    ),
    USER_EMAIL_IS_VERIFIED: new CustomBadRequestException(
        'User email has already been verified',
        'USER_EMAIL_IS_VERIFIED',
    ),
    VERIFY_EMAIL_REQUEST_NOT_FOUND: new CustomBadRequestException(
        'Verify email request not found or email has already been verified',
        'VERIFY_EMAIL_REQUEST_NOT_FOUND',
    ),
    VERIFY_EMAIL_REQUEST_EXPIRED: new CustomBadRequestException(
        'Verify email request has already expired',
        'VERIFY_EMAIL_REQUEST_EXPIRED',
    ),
    USER_EMAIL_ALREADY_EXISTS: new CustomBadRequestException(
        'User email already exists at workspace',
        'USER_EMAIL_ALREADY_EXISTS',
    ),
    HAS_OPEN_RESET_REQUEST: new CustomBadRequestException('There is an open reset request', 'HAS_OPEN_RESET_REQUEST'),
    PROFILE_EDITING_DISABLED: new CustomBadRequestException('Profile editing disabled', 'PROFILE_EDITING_DISABLED'),
    INVALID_EMAIL_FORMAT: new CustomBadRequestException('Invalid email format', 'INVALID_EMAIL_FORMAT'),
    NOT_FOUND_FLOW_DATA: new CustomBadRequestException('Not found flow data by id', 'NOT_FOUND_FLOW_DATA'),
    INACTIVATED_FLOW: new CustomBadRequestException('Flow inactive', 'INACTIVATED_FLOW'),
    NOT_FOUND_FLOW: new CustomBadRequestException('Not found flow by id', 'NOT_FOUND_FLOW'),
    NOT_FOUND_FLOW_LIBRARY: new CustomBadRequestException('Not found flow library by id', 'NOT_FOUND_FLOW_LIBRARY'),
    ERRO_CREATE_FLOW: new CustomBadRequestException('Error create flow in whatsapp', 'ERRO_CREATE_FLOW'),
    ERROR_PUBLISHED_FLOW: new CustomBadRequestException(
        `Flow cannot be published as it\'s not in DRAFT state`,
        'ERROR_PUBLISHED_FLOW',
    ),
    ALREADY_EXIST_GENERAL_BREAK_SETTING: new CustomBadRequestException(
        'ALREADY_EXIST_GENERAL_BREAK_SETTING',
        'ALREADY_EXIST_GENERAL_BREAK_SETTING',
    ),
    SMT_RE_TEAM_NOT_ALLOWED: new CustomBadRequestException(
        'Team is not allowed for this SMT-RE setting',
        'SMT_RE_TEAM_NOT_ALLOWED',
    ),
    INTERNAL_ERROR: (msg: string) =>
        new HttpException(
            {
                message: `Desculpe houve um erro`,
                location: msg,
                token: 'INTERNAL_ERROR',
            },
            500,
        ),
};

export const INTERNAL_ERROR_THROWER = (msg: string, e: any) => {
    if (
        e instanceof CustomBadRequestException ||
        e instanceof CustomForbiddenException ||
        e instanceof CustomNotFoundException ||
        e instanceof CustomConflictException ||
        e instanceof CustomBadGatewayException ||
        e instanceof CustomUnauthorizedException ||
        e instanceof CustomInternalServerErrorException
    ) {
        throw e;
    }
    try {
        Sentry.captureEvent({
            message: 'Internal error API',
            extra: {
                error: e,
                msg,
            },
        });
    } catch (e) {
        console.error('Error on sending sentry INTERNAL_ERROR', e);
    }
    errorCounter.labels(msg).inc();
    throw Exceptions.INTERNAL_ERROR(msg);
};

interface CatchErrorConfig {
    ignoreThrow?: boolean;
}
/**
 *
 * @param ignoreThrow não lança o erro para frente, não chama INTERNAL_ERROR_THROWER, usado
 *      por exemplo quando a função não retorna para nenhum lugar como um consumidor de fila
 * @returns
 */
export function CatchError(config?: CatchErrorConfig) {
    const { ignoreThrow } = config || {};
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;
        descriptor.value = async function (...args: any) {
            try {
                return await method.apply(this, args);
            } catch (e) {
                const errorPlace = `${this.constructor?.name}.${propertyKey}`;
                if (ignoreThrow) {
                    console.error(errorPlace, e);
                } else {
                    INTERNAL_ERROR_THROWER(errorPlace, e);
                }
            }
        };
    };
}
