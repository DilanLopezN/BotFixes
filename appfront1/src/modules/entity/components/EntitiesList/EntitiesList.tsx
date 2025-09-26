import { Component } from 'react';
import './EntitiesList.scss'
import { withRouter } from "react-router";
import { connect } from "react-redux";
import { EntityActions } from "../../redux/actions";
import { EntityService } from "../../services/EntityService";
import { EntitiesListProps, EntitiesListState } from "./EntitiesListProps";
import { isEmpty, orderBy } from "lodash";
import { ModalConfirm } from "../../../../shared/ModalConfirm/ModalConfirm";
import { EntityCard } from '../EntityCard/EntityCard';
import { GetArrayWords } from "../../../i18n/interface/i18n.interface";
import I18n from "../../../i18n/components/i18n";
import { searchResult } from '../../../../utils/SearchResult';
import { notification } from 'antd';
import BlockUi from '../../../../shared-v2/BlockUi/BlockUi';
import { ApiError } from '../../../../interfaces/api-error.interface';

class EntitiesListClass extends Component<EntitiesListProps, EntitiesListState> {

    private readonly translation: GetArrayWords;

    constructor(props) {
        super(props);
        this.state = {
            isOpenedModalDelete: false,
            isDeleting: false,
            entitiesSearchList: this.props.entitiesList || [],
        }
        this.translation = this.props.getArray([
            'Confirm delete',
            'Are you sure you want to delete entity',
            'Entities empty',
            'Item deleted successfully',
        ]);
    }

    private deleteItemEntity = async (workspaceId: string, entityId) => {
        let error: ApiError | null = null;

        this.setState({ isDeleting: true });

        await EntityService.deleteEntity(workspaceId, entityId, (e) => {
            error = e;
        });

        if (error) {
            notification.error({
                message: 'Entity is used by some interaction or attributes',
            });
        } else {
            notification.success({
                message: this.translation['Item deleted successfully'],
            });
            this.props.removeEntity(entityId);
        }

        this.setState({ isDeleting: false, isOpenedModalDelete: false });
    };

    changeEntityCurrent = (entity) => {
        this.props.setCurrentEntity(entity)
    };

    toggleModaldelete = () => {
        this.setState({  isOpenedModalDelete: !this.state.isOpenedModalDelete })
    };

    openModalDelete = (status: boolean) => {
        this.setState({  isOpenedModalDelete: status })
    };

    toggleModalDelete = () => {
        this.setState({  isOpenedModalDelete: !this.state.isOpenedModalDelete })
    }

    renderModalDelete = () => {
        const { entityCurrent } = this.props;
        return <ModalConfirm
            isOpened={true}
            onAction={(action) => {
                this.toggleModalDelete();
                if (!action) return null;
                this.setState({  isDeleting: true }, () => {
                    this.deleteItemEntity(this.props.match.params.workspaceId, entityCurrent._id)
                })
            }}
        >
            <h5>{this.translation['Confirm delete']}</h5>
            <p>{this.translation['Are you sure you want to delete entity']} <span>{entityCurrent.name}</span>?</p>
        </ModalConfirm>
    };

    componentDidUpdate(prevProps: any) {
        const { search, entitiesList } = this.props;

        if (prevProps.entitiesList !== entitiesList) {
            this.setState({ entitiesSearchList: entitiesList});
        }

        if (prevProps.search !== search) {
            this.setState({ entitiesSearchList: searchResult(search, entitiesList, 'name')});
        }
    }

    render() {
        const { entitiesSearchList } = this.state

        return <BlockUi className="EntitiesList" blocking={this.state.isDeleting}>
            <div 
                className="col-12"
                style={{
                    width: '75%',
                    margin: 'auto'
                }}
            >
                {entitiesSearchList && !isEmpty(entitiesSearchList)
                    ? orderBy(entitiesSearchList, ['name'])
                        .map((entity, index) => <EntityCard
                            entity={entity}
                            onOpenModalDelete={this.openModalDelete}
                            onChangeEntityCurrent={this.changeEntityCurrent}
                            key={index} />
                        )
                    : <div className="entities-empty">
                        <span>{this.translation['Entities empty']}</span>
                    </div>}
            </div>
            {this.state.isOpenedModalDelete ? this.renderModalDelete() : null}
        </BlockUi>
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    entitiesList: state.entityReducer.entitiesList,
    entityCurrent: state.entityReducer.entityCurrent,
    currentBot: state.botReducer.currentBot,
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export default I18n(withRouter(connect(
    mapStateToProps,
    {
        setCurrentEntities: EntityActions.setCurrentEntities,
        setCurrentEntity: EntityActions.setCurrentEntity,
        removeEntity: EntityActions.removeEntity,
    }
)(EntitiesListClass)));
