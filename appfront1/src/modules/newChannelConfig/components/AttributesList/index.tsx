import { FC, useState } from 'react';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import Header from '../Header';
import { AttributesListProps } from './props';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { ScrollView } from '../ScrollView';
import { Input } from 'antd';
import BotAttributesCopy from '../../../bot/components/BotAttributes ';

const { Search } = Input;

const AttributesList: FC<AttributesListProps & I18nProps> = (props) => {
    const { getTranslation, menuSelected } = props;
    const [search, setSearch] = useState('');
    return (
        <>
            <Wrapper>
                <Header title={menuSelected.title}></Header>
            </Wrapper>
            <ScrollView>
                <div
                    style={{
                        margin: '0 auto',
                        maxWidth: '1100px',
                        padding: '20px 30px',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Search
                            autoFocus
                            style={{
                                height: '38px',
                                width: '416px',
                                marginBottom: '10px',
                            }}
                            placeholder={getTranslation('Search')}
                            onChange={(ev: any) => setSearch(ev.target.value)}
                            allowClear
                        />
                    </div>
                    <BotAttributesCopy search={search} />
                </div>
            </ScrollView>
        </>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({});

export default i18n(withRouter(connect(mapStateToProps, null)(AttributesList)));
