import { FC } from 'react'
import { Wrapper } from '../../../../ui-kissbot-v2/common'
import { ActivityCardProps } from './props'
import styled from 'styled-components';
import moment from 'moment';
import { getWhatsAppFormatting } from '../../../../utils/Activity';
import ReactHtmlParser from 'react-html-parser';
import './style.scss';

export const Card = styled.div<any>`
    background: #FFF;
    padding: 8px 12px;
    flex-direction: column;
    cursor: pointer;
    &:hover {
        background: #f7f7f7;
    }
    border-bottom: 1px solid #F0F0F0;
`;

const ActivityCard: FC<ActivityCardProps> = ({
    activity,
    search,
    onClick,
    selected
}) => {

    const highlightActivity = () => {
        let searchText = search;

        try {
            searchText = searchText.replaceAll('(', '')
            searchText = searchText.replaceAll(')', '')
            if (searchText.split('').every(char => char === '.')) {
                searchText = `[${searchText}]`;
            }
            const indexMatch = activity.text.search(new RegExp(searchText.toLowerCase(), 'gi'));

            if (indexMatch && indexMatch > 25) {
                activity.text = `... ${activity.text.slice(indexMatch - 12)}`;
            }

            let newText: any = activity.text.replace(new RegExp(searchText.toLowerCase(), 'gi'), (text: string) => {
                return `<span class='highlight-text'>${text}</span>`;
            });

            const formatted = getWhatsAppFormatting(newText);
            return ReactHtmlParser(formatted);
        } catch (e) {
            console.log('error on function highlightActivity: ', e)
            return getWhatsAppFormatting(activity.text)
        }
    }

    return (
        <Card
            className={`ActivityCard ${selected == activity._id ? 'activitySelected' : ''}`}
            onClick={onClick}
            title={activity.text}
        >
            <Wrapper
                flexBox
                justifyContent='space-between'>
                <Wrapper
                    margin='0 0 5px'
                    fontSize='16px'
                    color='#555'>
                    {activity.from.name}
                </Wrapper>
                <Wrapper
                    fontSize='12px'
                    color='#888'>
                    {moment(activity.timestamp).format('DD/MM/YYYY')}
                </Wrapper>
            </Wrapper>
            <Wrapper
                color='#666'
                overflowY='hidden'
                height='24px'
                truncate>
                {highlightActivity()}
            </Wrapper>
        </Card>
    )
}

export default ActivityCard;
