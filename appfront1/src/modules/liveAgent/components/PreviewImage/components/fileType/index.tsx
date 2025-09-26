import React, { FC, useEffect, useState } from 'react';
import { CustomSelect } from '../../../../../../shared/StyledForms/CustomSelect/CustomSelect';
import { ManagerService } from '../modalIntegration/integration.service';
import i18n from '../../../../../i18n/components/i18n';
import { FileTypeProps } from './props';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';

interface FileTypeResponse {
    enviarPacs: boolean;
    handle: number;
    nome: string;
    temporario: boolean;
}

const FileType: FC<FileTypeProps & I18nProps> = ({
    getTranslation,
    imageTypeSelected,
    onChange,
    addNotification,
    workspaceId,
}) => {
    const [imageTypes, setImageTypes] = useState<FileTypeResponse[]>([]);

    useEffect(() => {
        getImageTypes();
    }, []);

    const getImageTypes = async () => {
        try {
            const response = await ManagerService.getImageTypes(workspaceId);
            setImageTypes(response.data);
            onChange({
                code: response.data?.[0]?.handle,
                name: response.data?.[0]?.nome,
            });
        } catch (error) {
            addNotification({
                title: getTranslation('Error'),
                message: getTranslation('Could not get image types'),
                type: 'warning',
                duration: 4000,
            });
        }
    };

    const getLabels = () => {
        return imageTypes.map((item) => ({
            label: item.nome,
            value: item.handle,
        }));
    };

    return (
        <div style={{ margin: '15px 0 0 0' }}>
            <p>{getTranslation('File type')}</p>
            <CustomSelect
                style={{
                    width: '100%',
                    margin: '10px 0',
                }}
                options={getLabels()}
                value={getLabels().find((item) => item?.value === imageTypeSelected)}
                placeholder={getTranslation('File type')}
                onChange={(item) => {
                    if (!item) {
                        return onChange({
                            name: getLabels()?.[0]?.label,
                            code: getLabels()?.[0]?.value,
                        });
                    }
                    return onChange({
                        code: item.value,
                        name: item.label,
                    });
                }}
            />
        </div>
    );
};

export default i18n(FileType) as FC<FileTypeProps>;
