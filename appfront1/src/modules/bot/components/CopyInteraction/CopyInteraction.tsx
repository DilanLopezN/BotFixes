import { FC } from 'react';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import i18n from '../../../i18n/components/i18n';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { CustomSelect } from '../../../../shared/StyledForms/CustomSelect/CustomSelect';
import { InteractionSelect } from '../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import { WorkspaceService } from '../../../workspace/services/WorkspaceService';
import { BotService } from '../../services/BotService';
import { Checkbox, Form } from 'antd';
import { FormItemInteraction } from '../../../../shared-v2/FormItemInteraction';
import { Workspace } from '../../../../model/Workspace';

export interface CopyInteractionProps {
    formik: any;
    workspaceList: Workspace[];
    currentBot: any;
}

const CopyInteraction: FC<CopyInteractionProps & I18nProps> = (props) => {
    const { getTranslation, currentBot, workspaceList, formik } = props;

    const getBotsWorkspace = async (workspaceId: string) => {
        const workspaceBots = await WorkspaceService.getWorkspaceBots(workspaceId);
        formik.setFieldValue('bots', workspaceBots.data);
        formik.setFieldValue('botId', workspaceBots.data[0]._id);
    };

    const getInteractions = async (workspaceId: string, botId: string) => {
        const interactionsList = await BotService.getInteractions(workspaceId, botId);
        formik.setFieldValue('interactions', interactionsList.data);
    };

    const getLabels = (list) => {
        return list.map((item) => ({
            label: item.name,
            value: item._id,
        }));
    };

    return (
        <Form key='copyInteraction'>
            <Form.Item>
                <LabelWrapper label={getTranslation('Choose a workspace')}>
                    <CustomSelect
                        onChange={(value) => {
                            if (value === null) {
                                formik.setFieldValue('workspaceId', currentBot.workspaceId);
                                formik.setFieldValue('interactions', []);
                                formik.setFieldValue('selectedInteraction', '');
                                getBotsWorkspace(currentBot.workspaceId);
                                return;
                            }
                            formik.setFieldValue('workspaceId', value.value);
                            formik.setFieldValue('interactions', []);
                            formik.setFieldValue('selectedInteraction', '');
                            getBotsWorkspace(value.value);
                        }}
                        value={getLabels(workspaceList).find((item) => item.value === formik.values.workspaceId)}
                        options={getLabels(workspaceList)}
                    />
                </LabelWrapper>
            </Form.Item>
            <Form.Item>
                {formik.values.bots.length > 0 && (
                    <LabelWrapper label={getTranslation('Choose a bot')}>
                        <CustomSelect
                            onChange={(value) => {
                                if (value === null) {
                                    formik.setFieldValue('botId', formik.values.bots[0]._id as string);
                                    formik.setFieldValue('selectedInteraction', '');
                                    getInteractions(formik.values.workspaceId, formik.values.bots[0]._id as string);
                                    return;
                                }
                                formik.setFieldValue('botId', value.value);
                                formik.setFieldValue('selectedInteraction', '');
                                getInteractions(formik.values.workspaceId, value.value);
                            }}
                            value={getLabels(formik.values.bots).find((item) => item.value === formik.values.botId)}
                            options={getLabels(formik.values.bots)}
                        />
                    </LabelWrapper>
                )}
            </Form.Item>
            <Form.Item>
                {formik.values.interactions.length > 0 && (
                    <FormItemInteraction
                        interaction={formik.values.selectedInteraction}
                        label={getTranslation('Copy to interaction')}
                    >
                        <InteractionSelect
                            options={formik.values.interactions || []}
                            interactionTypeToShow={['interaction', 'welcome']}
                            defaultValue={formik.values.selectedInteraction}
                            placeholder={getTranslation('Select a interaction')}
                            onChange={(event) => {
                                formik.setFieldValue('selectedInteraction', event.value);
                            }}
                        />
                    </FormItemInteraction>
                )}
            </Form.Item>
            <Form.Item>
                {formik.values.selectedInteraction && (
                    <LabelWrapper label={getTranslation('Select one of the options')}>
                        <Checkbox
                            onChange={() => formik.setFieldValue('nested', false)}
                            checked={!formik.values.nested}
                        >
                            {getTranslation('just this interaction')}
                        </Checkbox>
                        <Checkbox onChange={() => formik.setFieldValue('nested', true)} checked={formik.values.nested}>
                            {getTranslation('This interaction and your children')}
                        </Checkbox>
                    </LabelWrapper>
                )}
            </Form.Item>
        </Form>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    currentBot: state.botReducer.currentBot,
    workspaceList: state.workspaceReducer.workspaceList,
});

export default i18n(withRouter(connect(mapStateToProps, null)(CopyInteraction)));
