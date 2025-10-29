import { notification } from 'antd';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fileToBase64 } from '../../../../utils/File';
import { useLanguageContext } from '../../../i18n/context';
import { LoginActions } from '../../../login/redux/actions';
import { UserService } from '../../../settings/service/UserService';

export const useAvatarUpload = () => {
    const dispatch = useDispatch();
    const { getTranslation } = useLanguageContext();
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);

    const [url, setUrl] = useState(loggedUser.avatar);
    const [fileAvatar, setFileAvatar] = useState<File | undefined>(undefined);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    const selectAvatar = async (file: File) => {
        const maxSizeMB = 2;
        if (file.size > maxSizeMB * 1000000) {
            alert(getTranslation('Select a file up to 2MB'));
            return;
        }

        const encodedFile = await fileToBase64(file);
        setFileAvatar(file);
        setPreviewUrl(encodedFile.url);
    };

    const saveAvatar = async () => {
        if (!fileAvatar) return;

        const formData = new FormData();
        formData.append('attachment', fileAvatar);
        formData.append('workspaceId', selectedWorkspace._id);

        try {
            await UserService.updateAvatar(loggedUser._id, formData);

            setUrl(previewUrl);
            dispatch(
                LoginActions.update({
                    ...loggedUser,
                    avatar: previewUrl,
                })
            );

            setFileAvatar(undefined);
            setPreviewUrl('');

            notification.success({
                message: getTranslation('Success'),
                description: getTranslation('Avatar updated successfully'),
                duration: 2,
            });
        } catch (error) {
            notification.error({
                message: getTranslation('Error'),
                description: getTranslation('Failed to update avatar. Try again'),
                duration: 2,
            });
        }
    };

    const removeAvatar = async () => {
        if (!loggedUser._id) return;

        const response = await UserService.removeAvatar(loggedUser._id, loggedUser.avatar);

        if (response) {
            dispatch(
                LoginActions.update({
                    ...loggedUser,
                    avatar: undefined,
                })
            );
            setUrl('');
            setFileAvatar(undefined);
            setPreviewUrl('');

            notification.success({
                message: getTranslation('Success'),
                description: getTranslation('Avatar removed successfully'),
                duration: 2,
            });
        }
    };

    return { url, fileAvatar, previewUrl, selectAvatar, saveAvatar, removeAvatar };
};
