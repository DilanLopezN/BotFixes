import { notification } from 'antd';
import { AxiosError } from 'axios';
import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Action } from 'redux';
import { ApiError } from '../../../../../../interfaces/api-error';
import { WorkspaceActions } from '../../../../../workspace/redux/actions';
import { WorkspaceService } from '../../../../../workspace/services/WorkspaceService';
import { SettingsService } from '../../../../service/SettingsService';

export const useEnableRatingDetails = () => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const [isToggling, setIsToggling] = useState(false);
    const [toggleError, setToggleError] = useState<ApiError>();
    const dispatch = useDispatch();

    const toggleRatingDetails = useCallback(
        async (enableRating: boolean) => {
            if (isToggling) return;

            try {
                setToggleError(undefined);
                setIsToggling(true);

                const updatedWorkspace = await WorkspaceService.updateFlagsAndConfigs(selectedWorkspace?._id, {
                    generalConfigs: { enableRating },
                });

                if (updatedWorkspace) {
                    dispatch(WorkspaceActions.setSelectedWorkspace(updatedWorkspace) as Action);
                }

                if (enableRating) {
                    const ratingSetting = await SettingsService.getRatingSettings(selectedWorkspace._id);
                    if (!ratingSetting) {
                        await SettingsService.createRating(
                            selectedWorkspace._id,
                            {
                                ratingText: 'Como foi seu atendimento conosco?',
                                feedbackText: 'Deixe uma mensagem para nós:',
                                linkText: 'Avalie seu atendimento no link abaixo',
                                disableLinkAfterRating: false,
                                expiresIn: null,
                            },
                            (err: any) => {
                                if (err) {
                                    notification.error({ message: 'Erro ao criar configuração de avaliação' });
                                }
                            }
                        );
                    }
                }

                setIsToggling(false);
                return true;
            } catch (error) {
                if (error instanceof AxiosError && error.response) {
                    notification.error({
                        message: error.response.data.message || 'Error toggling rating details',
                    });
                }
                setToggleError(error as ApiError);
                setIsToggling(false);
                return false;
            }
        },
        [dispatch, isToggling, selectedWorkspace?._id]
    );

    return {
        isToggling,
        toggleError,
        toggleRatingDetails,
    };
};
