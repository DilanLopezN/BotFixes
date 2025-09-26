import { FC } from "react";
import { I18nProps } from "../../../../../../../i18n/interface/i18n.interface";
import I18n from "../../../../../../../i18n/components/i18n";
import { FormEditingFiltersProps } from "./props";
import { Wrapper, PrimaryButton } from "../../../../../../../../ui-kissbot-v2/common";
import { Constants } from "../../../../../../../../utils/Constants";
import { GetFiltersUsersLocal } from "../../../../../../../../utils/GetFiltersUsersLocal";
import { InputSimple } from "../../../../../../../../shared/InputSample/InputSimple";
import { ColorType } from "../../../../../../../../ui-kissbot-v2/theme";
import mixpanel from 'mixpanel-browser';

const FormEditingFilter: FC<FormEditingFiltersProps & I18nProps> = ({
    getTranslation,
    onApply,
    setFilterName,
    userId,
    workspaceId,
    filterId,
    filterName,
    values,
    onCancel
}) => {

    const setFilterUsersLocal = (filter) => {
        const replFilter = {
            ...GetFiltersUsersLocal(),
            [workspaceId]: {
                ...GetFiltersUsersLocal()?.[workspaceId],
                [userId]: {
                    ...GetFiltersUsersLocal()?.[workspaceId]?.[userId],
                    [filterId]: {
                        name: filterName.trim(),
                        filter: filter
                    }
                }
            }
        }
        localStorage.setItem(Constants.LOCAL_STORAGE_MAP.LIVE_AGENT_FILTERS_USERS, JSON.stringify(replFilter))
    }

    return <>
        <Wrapper borderBottom='1px #e8e8e8 solid' margin='0 0 5px 0' />
        <InputSimple autoFocus 
            value={filterName}
            maxLength={50}
            placeholder={getTranslation('Name')}
            onChange={(event) => { setFilterName(event.target.value) }} />
        <Wrapper
            flexBox
            margin='10px 0'
            justifyContent='space-between'
        >
            <PrimaryButton colorType={ColorType.text} onClick={() => onCancel()}>
                {getTranslation('Cancel')}
            </PrimaryButton>

            <PrimaryButton disabled={filterName.trim() ? false : true} onClick={() => {
                if(filterName.trim()){
                    setFilterUsersLocal(values);
                    onApply(values)

                    try {
                        mixpanel.track('@transbordo.filtro-customizado-salvar');
                    } catch (error) {console.error(`mixpanel.track ${JSON.stringify({error})}`)}
                }
            }}>
                {`${getTranslation('Save')} / ${getTranslation('Apply')}`}
            </PrimaryButton>
        </Wrapper>
        {filterName.trim() &&
            <Wrapper
                width='160px'
                position='absolute'
                left='70px'
                color='#444'
                top='20px'
                fontSize='18px'
                fontWeight='500'
                overflowX='hidden'
                style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
            >
                {`- ${filterName}`}
            </Wrapper>
        }
    </>

}

export default I18n(FormEditingFilter) as FC<FormEditingFiltersProps>;