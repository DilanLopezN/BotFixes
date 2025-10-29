import React from 'react';
import { wordsList } from './i18nMap';
import { I18nWrapperProps } from './props';
import { Languages, GetArrayWords } from '../interface/i18n.interface';
import store from '../../../redux/store';
import { UserLanguage } from 'kissbot-core';

const I18nWrapper = (PassedComponent: typeof React.Component) => {
    return class extends React.Component<I18nWrapperProps> {
        defaultLanguage: string = 'pt';
        language: string = this.priorityLanguage();

        private priorityLanguage(): string {
            const state: any = store.getState();
            const language = state.loginReducer?.loggedUser?.language || UserLanguage.pt;

            if (!!language && Languages[language]) {
                return language;
            }

            return this.defaultLanguage;
        }

        private get(value: string): string {
            if (!wordsList.hasOwnProperty(value)) {
                return value;
            }

            return wordsList[value][this.language] || value;
        }

        private getArray(values: string[]): GetArrayWords {
            const textList = {} as GetArrayWords;

            values.forEach((i: string) => {
                const findedText = wordsList[i];
                findedText && findedText[this.language] ? (textList[i] = findedText[this.language]) : (textList[i] = i);
            });
            return textList;
        }

        render() {
            return (
                <PassedComponent
                    getTranslation={(ev: string) => this.get(ev)}
                    getArray={(ev: string[]) => this.getArray(ev)}
                    {...this.props}
                />
            );
        }
    };
};

export default I18nWrapper as any;
