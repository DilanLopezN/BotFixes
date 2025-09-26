import { useDispatch, useSelector } from 'react-redux';
import { BotAttribute } from '../../../../../model/BotAttribute';
import { IParameter, IUserSay, Language } from '../../../../../model/Interaction';
import { BotActions } from '../../../redux/actions';
import IntentsFormV2 from '../IntentsV2/IntentsFormV2';
import { UserSaysBotV2 } from '../user-says-bot-v2';


const UserSaysSynchronize = () => {
    const dispatch = useDispatch();
    const botAttributes = useSelector((state: any) => state.botReducer.botAttributes);
    const selectedLanguage = useSelector((state: any) => state.botReducer.selectedLanguage);
    const currentInteraction = useSelector((state: any) => state.botReducer.currentInteraction);
    const entitiesList = useSelector((state: any) => state.entityReducer.entitiesList);
    const modalInteractionSubmitted = useSelector((state: any) => state.botReducer.modalInteractionSubmitted);

    const onChangeInput = (userSays: IUserSay[], isValid: boolean) => {
        const newData = synchronizeParameters(userSays);
        userSays = newData.userSays;
        const languages: Language[] = currentInteraction.languages || [];
        const updatedLanguages = languages.map((language: Language) => {
            if (language.language === selectedLanguage) {
                return {
                    ...language,
                    userSays,
                    userSaysIsValid: isValid,
                };
            }
            return language;
        });
        updateLanguagesAndParameters(updatedLanguages, newData.parameters);
    };

    const onChangeIntents = (intents: string[]) => {
        const updatedLanguages = currentInteraction.languages.map((language: Language) => {
            if (language.language === selectedLanguage) {
                return {
                    ...language,
                    intents,
                };
            }
            return language;
        });
        dispatch(
            BotActions.setCurrentInteraction({
                ...currentInteraction,
                languages: updatedLanguages,
            })
        );
    };

    const synchronizeParameters = (
        userSays: Array<IUserSay>
    ): { parameters: Array<IParameter>; userSays: Array<IUserSay> } => {
        let currentParameters: Array<IParameter> = currentInteraction.parameters || [];
        userSays = userSays.map((userSay) => {
            if (userSay.parts) {
                userSay.parts = userSay.parts.map((part) => {
                    if (part?.type) {
                        const attr: BotAttribute | undefined = botAttributes.find(
                            (botAttr) => botAttr.name === part.value
                        );
                        if (attr) {
                            part.type = attr.type;
                            let param = currentParameters.find((param) => param.name === part.value);
                            let isNewParam = false;
                            const type = part.type ? part.type.replace('@', '') : null;
                            let entity = entitiesList.find((entity) => type === entity.name);
                            if (!param) {
                                isNewParam = true;
                                param = {} as IParameter;
                            }
                            param.name = part.value || '';
                            param.type = part.type;
                            param.mandatory = part.mandatory;
                            param.typeId = entity ? entity._id : undefined;
                            if (isNewParam) {
                                currentParameters.push(param);
                            } else {
                                currentParameters = currentParameters.map((existsParam) => {
                                    if (param && existsParam.name === param.name && existsParam.type == param.type) {
                                        return param;
                                    }
                                    return existsParam;
                                });
                            }
                        }
                    }
                    return part;
                });
            }
            return userSay;
        });
        currentParameters = removeNotUsedParameters(currentParameters, userSays);
        return { userSays, parameters: currentParameters };
    };

    const removeNotUsedParameters = (parameters: Array<IParameter>, userSays: Array<IUserSay>): Array<IParameter> => {
        return parameters.filter((param) => {
            return !!userSays.find((userSay) => {
                return !!userSay.parts.find((part) => part?.value === param.name);
            });
        });
    };

    const updateLanguagesAndParameters = (languages: Language[], parameters: IParameter[]) => {
        dispatch(
            BotActions.setCurrentInteraction({
                ...currentInteraction,
                languages,
                parameters,
            })
        );
    };

    // useEffect(() => {
    //     dispatch(BotActions.setCurrentInteraction({ ...currentInteraction }));
    // }, []);

    if (!currentInteraction) return null;
    const language: Language | undefined = currentInteraction.languages.find(
        (lang: Language) => lang.language === selectedLanguage
    );

    const userSays: IUserSay[] = language && language.userSays ? language.userSays : [{ parts: [{ value: '' }] }];

    const intents: string[] = language ? language.intents || [] : [];
    const languageIsValid: boolean = !!language?.userSaysIsValid;

    return (
        <div className='modal-interaction-content card'>
            <div style={{ background: '#fff', padding: '8px 34px 0 34px', marginBottom: 10 }}>
                <UserSaysBotV2
                    isSubmitted={modalInteractionSubmitted}
                    isValidUserSays={languageIsValid}
                    userSays={userSays}
                    onChangeInput={onChangeInput}
                />
            </div>
            <div style={{ background: '#fff', padding: '8px 34px 0 34px' }}>
                <IntentsFormV2 intents={intents} onChangeInput={onChangeIntents} />
            </div>
        </div>
    );
};
export const UserSaysTabV2 = UserSaysSynchronize;
