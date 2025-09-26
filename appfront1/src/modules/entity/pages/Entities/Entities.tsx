import React, { Component, Suspense } from 'react';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import Page from '../../../../shared/Page';
import './Entities.scss';
import { AddBtn } from '../../../../shared/StyledForms/AddBtn/AddBtn';
import { EntityActions } from '../../redux/actions';
import { Entity } from 'kissbot-core';
import { EntityService } from '../../services/EntityService';
import I18n from '../../../i18n/components/i18n';
import { PaginatedModel } from '../../../../model/PaginatedModel';
import { Input } from 'antd';
import { LoadingArea, Spin } from '../../../../shared/Spin/spin';

const EntitiesList = React.lazy(() => import('../../components/EntitiesList/EntitiesList'));

const { Search } = Input;

interface EntitiesState {
    search: string;
}

class EntityClass extends Component<any, EntitiesState> {
    constructor(props) {
        super(props);
        this.state = {
            search: '',
        };
    }

    componentDidMount() {
        this.getListEntity();
    }

    private getListEntity = async () => {
        if (!this.props.selectedWorkspace) return null;
        const listEntity: PaginatedModel<Entity> = await EntityService.getEntityList(this.props.selectedWorkspace._id);
        this.props.setCurrentEntities(listEntity ? listEntity.data : []);
    };

    render() {
        const { getTranslation } = this.props;

        return (
            <Page className='Entity'>
                <div className='row header'>
                    <div className='col-lg-5 entities-group-title'>
                        <h4>{getTranslation('Entities')}</h4>
                        <Link
                            to={`/workspace/${
                                this.props.selectedWorkspace && this.props.selectedWorkspace._id
                            }/entities/create`}
                        >
                            <AddBtn />
                        </Link>
                    </div>
                    <Search
                        autoFocus
                        className='search'
                        style={{
                            height: '38px',
                            width: '416px',
                            marginRight: '15px',
                        }}
                        placeholder={getTranslation(`Search`)}
                        onChange={(ev: any) => this.setState({ search: ev.target.value })}
                        allowClear
                    />
                </div>
                <div className='entities-list'>
                    <Suspense
                        fallback={
                            <LoadingArea>
                                <Spin />
                            </LoadingArea>
                        }
                    >
                        <EntitiesList search={this.state.search} />
                    </Suspense>
                </div>
            </Page>
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export const Entities = I18n(
    withRouter(
        connect(mapStateToProps, {
            setCurrentEntities: EntityActions.setCurrentEntities,
        })(EntityClass)
    )
);
