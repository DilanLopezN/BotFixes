import { I18nProps } from './../../../../../i18n/interface/i18n.interface';
import { ProviderResponse } from "../../../../../../model/Provider";
import { Interaction, Language } from "../../../../../../model/Interaction";

export interface AddResponseButtonProps extends I18nProps {
    providerResponse: ProviderResponse;
    currentInteraction: Interaction;
    selectedLanguage: string;
    modalInteractionSubmitted: boolean;
    onChangeLanguage: (languages: Array<Language>) => any;
    children?: React.ReactNode;
}
