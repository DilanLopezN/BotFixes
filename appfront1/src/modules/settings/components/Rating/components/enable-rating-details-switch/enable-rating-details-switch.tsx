import { SwitchChangeEventHandler } from 'antd/es/switch';
import { Switch } from 'antd/lib';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useEnableRatingDetails } from '../../hooks/use-enable-rating-details';

interface EnableRatingDetailsProps {
    onActive: (isActive: boolean) => void;
}

export const EnableRatingDetailsSwitch = ({ onActive }: EnableRatingDetailsProps) => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const { isToggling, toggleRatingDetails } = useEnableRatingDetails();

    const [checked, setChecked] = useState(selectedWorkspace?.generalConfigs?.enableRating);

    const handleCheck: SwitchChangeEventHandler = async (value) => {
        const result = await toggleRatingDetails(value);
        if (result) {
            setChecked(value);
        }
    };

    useEffect(() => {
        onActive(!!checked);
    }, [checked, onActive]);

    return <Switch checked={checked} onChange={handleCheck} loading={isToggling} />;
};
