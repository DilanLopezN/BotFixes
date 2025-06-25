
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongooseAbstractionService } from '../../../common/abstractions/mongooseAbstractionService.service';
import { Interaction } from '../interfaces/interaction.interface';
import { ILanguageInteraction } from '../interfaces/language.interface';
import { IResponse } from '../interfaces/response.interface';
import { BotAttribute } from '../../botAttributes/interfaces/botAttribute.interface';
import { BotAttributesService } from '../../botAttributes/botAttributes.service';
import { IResponseElementSetAttribute } from '../interfaces/responseType.interface';
import { IResponseElementQuestion, ResponseType } from 'kissbot-core';
import { BotAttributesModel } from '../../botAttributes/schemas/botAttribute.schema';
import { CacheService } from './../../_core/cache/cache.service';
import { isArray, differenceBy, uniqBy } from 'lodash';
import { castObjectIdToString } from '../../../common/utils/utils';

@Injectable()
export class CreateAttributesService extends MongooseAbstractionService<Interaction> {
    constructor(
        @InjectModel('Interaction') protected readonly model: Model<Interaction>,
        @Inject(forwardRef(() => BotAttributesService))
        private readonly botAttributesService: BotAttributesService,
        cacheService: CacheService,
    ) {
        super(model, cacheService);
    }

    getSearchFilter(search: string) { }
    getEventsData() { }

    public async createBotAttributes(interaction: Interaction) {
        const existingBotAttr: Array<BotAttribute> = await this.botAttributesService
            .findByInteractionIdAndBotId(interaction._id, interaction.botId);

        const languages: Array<Promise<any>> = interaction.languages.map(async (language: ILanguageInteraction) => {
            const responses: Array<IResponse> = language.responses
                .filter((response: IResponse) => this.responseMustCreateBotAttributes(response));

            return await this.getInteractionBotAttributesSaved(responses, interaction);
        });

        await this.removeUnusedAttrs(interaction, existingBotAttr);
        return await Promise.all(languages);
    }

    async removeUnusedAttrs(interaction: Interaction, existingBotAttr: BotAttribute[]) {
        const removedAttrs = [];
        const attrs: BotAttribute[] = [];

        interaction.languages.map(async (language: ILanguageInteraction, langIndex: number) => {

            interaction.languages[langIndex].userSays.forEach(say => {
                say.parts.forEach(part => {
                    if (part.type && part.value) {
                        attrs.push({
                            name: part.value,
                            type: part.type,
                        } as any);
                    }
                });
            });

            return language.responses
                .filter((response: IResponse) => this.responseMustCreateBotAttributes(response))
                .map(response =>
                    response.elements.map(elem =>
                        this.getBotattrByResponseType(response, elem, interaction) as any),
                )
                .map((botAttr: BotAttribute[]) => {
                    const [attr]: any = botAttr;
                    if (isArray(attr)) {
                        attr.map((item: BotAttribute) => attrs.push(item));
                    } else {
                        attrs.push(attr);
                    }
                });
        });

        const deleteInteraction = (attributeId: string, interactionId: string) => this.botAttributesService.updateRaw({ _id: attributeId }, {
            $pull: {
                interactions: interactionId,
            },
        });

        const difference = differenceBy(existingBotAttr, attrs, 'name');
        if (differenceBy && difference.length > 0)
            difference.map((attr: BotAttribute) => {
                if (attr.interactions.length === 1)
                    return removedAttrs.push(
                        this.botAttributesService.delete(castObjectIdToString(attr._id), undefined, true),
                    );
                return removedAttrs.push(
                    deleteInteraction(castObjectIdToString(attr._id), castObjectIdToString(interaction._id)),
                );
            });

        return await Promise.all(removedAttrs);
    }

    /**
     * Função para identificar se um response deve criar um botAttribute
     * @param response
     */
    private responseMustCreateBotAttributes(response: IResponse): boolean {
        return response.type == ResponseType.SET_ATTRIBUTE
            || response.type == ResponseType.QUESTION
            || response.type == ResponseType.HTTP_HOOK
            || response.type == ResponseType.FAQ
            || response.type == ResponseType.GUIA_MEDICO
            || response.type == ResponseType.STATUS_GUIA
            || response.type == ResponseType.QR_BUSCA_ID
            || response.type == ResponseType.GUIA_BENEFICIARIO;
    }

    /**
     * Função para criar botAttribute a partir de uma response, com map dos elementos
     * @param response
     * @param interaction
     * @param existingBotAttr
     */
    private async getInteractionBotAttributesSaved(
        responses: IResponse[],
        interaction: Interaction) {

        const botAttrList = [];
        const existingBotAttrs: Array<BotAttribute> = await this.botAttributesService
            .getAll({ botId: interaction.botId, deletedAt: undefined });

        responses.map(response => {
            response.elements.map(
                (element: IResponseElementSetAttribute | IResponseElementQuestion) => {
                    botAttrList.push(...this.getBotattrByResponseType(response, element, interaction) as any);
                });
        });

        const update = async (attr) => {
            const botAttrPromises = [];

            const botAttr = new BotAttributesModel(attr);
            const defaultBotAttributes: Array<any> = this.botAttributesService.getDefaultBotAttributes();
            const isDefault: boolean = !!defaultBotAttributes.find((defaultAttribute) => {
                return defaultAttribute.name == botAttr.name;
            });

            if (isDefault)
                return null;

            const botAttrAlreadyExists = existingBotAttrs.find(existingBotAttrItem => {
                return botAttr.name == existingBotAttrItem.name;
            });

            if (!!botAttrAlreadyExists && botAttrAlreadyExists.botId + '' === botAttr.botId + '') {
                return botAttr.interactions.forEach(interactionId => {
                    if (botAttrAlreadyExists.interactions.includes(interactionId)) return;

                    botAttrPromises.push(this.botAttributesService.updateRaw({ _id: botAttrAlreadyExists._id }, {
                        $addToSet: {
                            interactions: [...botAttrAlreadyExists.interactions, ...botAttr.interactions],
                        },
                    }));
                });
            }
            botAttrPromises.push(this.botAttributesService.create(botAttr));
            return Promise.all(botAttrPromises);
        };

        const botListAttrsMerged = [];
        botAttrList.map(async (attr) => botListAttrsMerged.push(attr));

        const uniqueInInteraction = uniqBy(botListAttrsMerged, 'name');
        uniqueInInteraction.map(async (attr) => await update(attr));
    }

    /**
     * Função para criar um objeto botAttr de acordo com tipo de response.
     * Funciona tipo uma factory.
     * @param response
     * @param element
     * @param interaction
     */
    private getBotattrByResponseType(response: IResponse, element: any, interaction: Interaction) {
        const defaultFields = {
            botId: interaction.botId,
            interactions: [interaction._id],
        };

        const attrsToReturn = [];

        if (response.type == ResponseType.SET_ATTRIBUTE) {
            attrsToReturn.push({
                ...defaultFields,
                name: element.name,
                type: element.type,
                label: element.label,
            });
        }
        if (response.type == ResponseType.QUESTION) {
            attrsToReturn.push({
                ...defaultFields,
                name: element.name,
                type: element.entity,
            });
        }
        if (response.type == ResponseType.HTTP_HOOK) {
            attrsToReturn.push({
                ...defaultFields,
                name: element.attrName,
                type: element.attrType,
            });
        }
        if (response.type == ResponseType.FAQ) {
            attrsToReturn.push({
                ...defaultFields,
                name: element.attrName,
                type: element.attrType,
            });
        }
        if (response.type == ResponseType.GUIA_MEDICO) {
            attrsToReturn.push(...[
                {
                    ...defaultFields,
                    name: element.specialityAttribute,
                    type: '@sys.any',
                },
                {
                    ...defaultFields,
                    name: element.cityAttribute,
                    type: '@sys.any',
                },
                {
                    ...defaultFields,
                    name: element.serviceCodeAttribute,
                    type: '@sys.any',
                },
                {
                    ...defaultFields,
                    name: element.specializedServiceAttribute,
                    type: '@sys.any',
                },
            ]);
        }

        if (response.type == ResponseType.STATUS_GUIA) {
            attrsToReturn.push({
                ...defaultFields,
                name: element.guideNumber,
                type: element.guideNumberType,
            });
        }

        if (response.type == ResponseType.QR_BUSCA_ID) {
            attrsToReturn.push({
                ...defaultFields,
                name: element.saveOnAttr,
                type: '@sys.any',
            });
        }

        if (response.type == ResponseType.GUIA_BENEFICIARIO) {
            attrsToReturn.push({
                ...defaultFields,
                name: element.beneficiarioNumber,
                type: '@sys.any',
            });
        }

        return attrsToReturn.filter(attr => attr.name);
    }
}