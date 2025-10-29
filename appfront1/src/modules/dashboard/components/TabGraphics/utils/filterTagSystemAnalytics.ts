import { TemplateGroupField } from "../interfaces/conversation-template-interface";

export const filterTagSystemAnalytics = (data: any[], groupField: TemplateGroupField) => {
    try {
        if (groupField !== TemplateGroupField.tags) {
            return data;
        }
        
        return data.filter(currElement => !currElement?.agg_field?.startsWith('@sys'))
        
    } catch (err) {
        console.log('error filterTagSystemAnalytics: ', err);
    }
};