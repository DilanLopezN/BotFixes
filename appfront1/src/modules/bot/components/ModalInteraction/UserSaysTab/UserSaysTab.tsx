import React, {Component} from "react";
import {UserSays} from "../UserSays/UserSays";
import {UserSaysTabState, UserSaysTabProps} from "./UserSaysTabProps";
import { connect } from "react-redux";
import isEmpty from 'lodash/isEmpty';
import { BotActions } from "../../../redux/actions";
import { Interaction, Language, IUserSay, IParameter } from "../../../../../model/Interaction";
import { BotAttribute } from "../../../../../model/BotAttribute";
import IntentsForm from "../Intents/IntentsForm";

class UserSaysTabClass extends Component<UserSaysTabProps, UserSaysTabState> {

    onChangeInput = (userSays: Array<IUserSay>, isValid: boolean) => {
        const newData = this.synchronizeParameters(userSays);
        userSays = newData.userSays;
        const languages: Array<Language> = this.props.currentInteraction.languages;
        if (!isEmpty(languages)){
            languages.map((language: Language) => {
                if(language.language == this.props.selectedLanguage){
                    language.userSays = userSays;
                    language.userSaysIsValid = isValid;
                }
                return language;
            });
        } else{
            const newResponse =   {
                responses : [],
                userSays : userSays,
                language : this.props.selectedLanguage
              };
              languages.push(newResponse)
        }
        this.updateLanguagesAndParameters(languages, newData.parameters);
    };

    onChangeIntents = (intents: string[]) => {
        const languages: Array<Language> = this.props.currentInteraction.languages;
        languages.map((language: Language) => {
            if(language.language == this.props.selectedLanguage){
                language.intents = intents;
            }
            return language;
        });

        const currentInteraction: Interaction = this.props.currentInteraction;
        currentInteraction.languages = languages;
        this.props.setCurrentInteraction(currentInteraction);
        this.forceUpdate();
    }

    /**
     * Função que gera os parametros de acordo com o userSays
     * Para cada IPart que for do tipo handlebars, ou seja, a que tiver um parametro tipo,  é buscado o 
     * botAttribute correspondete ao nome que esterá presente o ipart.então o part é sincronizado ao botAttribute, ou seja 
     * o type da ipart é atualizado de acordo com o botAttr.
     * É feito uma busca nos parametro existentes, e atualiza ou cria um parametro de acordo com a ipart.
     * @param userSays
     */
    synchronizeParameters = (userSays: Array<IUserSay>): {parameters: Array<IParameter>, userSays: Array<IUserSay> } => {
        let currentParameters: Array<IParameter> = this.props.currentInteraction.parameters || [];
        userSays = userSays.map(userSay => {
            if(userSay.parts){
                userSay.parts = userSay.parts.map(part => {
                    if(part.type){
                        const attr: BotAttribute | undefined = this.props.botAttributes.find(botAttr => botAttr.name == part.value);
                        if(attr){
                            part.type = attr.type;
                            let param = currentParameters.find(param => param.name == part.value);
                            let isNewParam = false;
                            const type = part.type ? part.type.replace("@", "") : null;
                            let entity = this.props.entitiesList.find(entity => type == entity.name);
                            if(!param){
                                isNewParam = true
                                param = {} as IParameter;
                            }
                            param.name = part.value || "";
                            param.type = part.type;
                            param.mandatory = part.mandatory;
                            param.typeId = entity ? entity._id : undefined;
                            if(isNewParam){
                               currentParameters.push(param); 
                            }else{
                                currentParameters = currentParameters.map(existsParam => {
                                    if(param && existsParam.name == param.name && existsParam.type == param.type){
                                        return param;
                                    }
                                    return existsParam;
                                });
                            }
                        }
                    }
                    return part;
                })
            }
            return userSay;
        });
        currentParameters = this.removeNotUsedParameters(currentParameters, userSays);
        return {userSays, parameters: currentParameters};
    }

    /**
     * Função para remover os parametros que não estão sendo usado no userSays
     */
    private removeNotUsedParameters = (parameters: Array<IParameter>, userSays: Array<IUserSay>): Array<IParameter> => {
        return parameters.filter(param => {
            return !!userSays.find(userSay => {
                return !!userSay.parts.find(part => part.value == param.name);
            })
        })
    }

    private updateLanguagesAndParameters = (languages: Array<Language>, parameters: Array<IParameter>) => {
        const currentInteraction: Interaction = this.props.currentInteraction;
        currentInteraction.languages = languages;
        currentInteraction.parameters = parameters;
        this.props.setCurrentInteraction(currentInteraction);
        this.forceUpdate();
    };

    render() {
        if(!this.props.currentInteraction) return null;
        const language: Language = this.props.currentInteraction.languages.find((language: Language) => {
            return language.language == this.props.selectedLanguage;
        }) as Language;

        const userSays: Array<IUserSay> = language && language.userSays ? language.userSays : [{
            parts : [{ value : "" }]
        }];
        const intents = language && language.intents ? language.intents : []
        const languageIsValid = language ? language.userSaysIsValid : false;
        return <div className="modal-interaction-content card">
            <UserSays
                isSubmitted={this.props.modalInteractionSubmitted}
                isValidUserSays={languageIsValid}
                userSays={userSays}
                onChangeInput={this.onChangeInput}
            />
            <IntentsForm
                intents={intents}
                onChangeInput={this.onChangeIntents}
            />
        </div>
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    selectedLanguage: state.botReducer.selectedLanguage,
    currentInteraction: state.botReducer.currentInteraction,
    botAttributes: state.botReducer.botAttributes,
    entitiesList: state.entityReducer.entitiesList,
    modalInteractionSubmitted: state.botReducer.modalInteractionSubmitted,
});

export const UserSaysTab = connect(
    mapStateToProps,
    {
        setCurrentInteraction : BotActions.setCurrentInteraction
    }
)(UserSaysTabClass);
