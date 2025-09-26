import { FC } from 'react';
import i18n from '../../../i18n/components/i18n';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import ContactList from '../ConversationContainer/components/ContactList';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import ActivityList from '../ActivityList';
import { ContactListProps } from '../ConversationContainer/components/ContactList/props';
import { TabItem } from './styled';
import { ActivityListProps } from '../ActivityList/props';
import ConversationSearchList from '../ConversationSearchList';
import { ConversationSearchListProps } from '../ConversationSearchList/props';
import { tabs, useContersationContainerContext } from '../ConversationContainer/conversation-container.context';

type InitialSearchResultDynamicProps = ContactListProps & ConversationSearchListProps & ActivityListProps;

const InitialSearchResult = ({ getTranslation, ...props }: InitialSearchResultDynamicProps & I18nProps) => {
    const { setTabFilterSelected, tabFilterSelected } = useContersationContainerContext();

    return (
        <Wrapper height='100%' overflowY='auto' overflowX='hidden' flexBox column flex>
            <Wrapper flexBox margin='0 0 4px 0' bgcolor='#f8f8f8' alignItems='center'>
                <TabItem
                    className={`${tabFilterSelected === tabs.conversations && 'active'}`}
                    onClick={() => setTabFilterSelected(tabs.conversations)}
                    title={getTranslation('Conversations')}
                >
                    {getTranslation('Conversations')}
                </TabItem>
                <TabItem
                    className={`${tabFilterSelected === tabs.contacts && 'active'}`}
                    onClick={() => setTabFilterSelected(tabs.contacts)}
                    title={getTranslation('Contacts')}
                >
                    {getTranslation('Contacts')}
                </TabItem>
                <TabItem
                    className={`${tabFilterSelected === tabs.activities && 'active'}`}
                    onClick={() => setTabFilterSelected(tabs.activities)}
                    title={getTranslation('Messages')}
                >
                    {getTranslation('Messages')}
                </TabItem>
            </Wrapper>
            {tabFilterSelected === tabs.conversations && <ConversationSearchList {...props} />}
            {tabFilterSelected === tabs.contacts && <ContactList {...props} />}
            {tabFilterSelected === tabs.activities && <ActivityList {...props} />}
        </Wrapper>
    );
};

export default i18n(InitialSearchResult) as FC<InitialSearchResultDynamicProps>;
