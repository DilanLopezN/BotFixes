import { FC } from 'react'
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface'
import { ConversationFilterIntervals, ConversationFilterIntervalsHour } from '../ConversationFilter';

interface Props {
    defaultValue: string;
    onChange: (interval: string) => any
    tabConversationTotal?: boolean;
}

const SelectInterval: FC<Props & I18nProps> = ({ onChange, defaultValue, getTranslation, tabConversationTotal }) => {
    return <select
        className="form-control form-control-sm"
        defaultValue={defaultValue}
        onChange={event => {
            onChange(event.target.value)
        }}
    >
        {
            tabConversationTotal ?
        Object.keys(ConversationFilterIntervalsHour).map((key: string) => (
            <option value={ConversationFilterIntervalsHour[key].key}>{getTranslation(ConversationFilterIntervalsHour[key].name)}</option>
        ))
        :
        Object.keys(ConversationFilterIntervals).map((key: string) => (
            <option value={ConversationFilterIntervals[key].key}>{getTranslation(ConversationFilterIntervals[key].name)}</option>
        ))
        }
    </select>
}

export default i18n(SelectInterval) as FC<Props>;
