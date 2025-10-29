import { Component } from 'react';
import Page from '../../../../shared/Page';
import './EntityCreate.scss';
import { EntityCreateProps, EntityState } from "./EntityCreateProps";
import { Workspace } from "../../../../model/Workspace";
import { WorkspaceService } from "../../../workspace/services/WorkspaceService";
import { EntityService } from "../../services/EntityService";
import isEmpty from 'lodash/isEmpty';
import { withRouter } from "react-router";
import { connect } from "react-redux";
import { EntityActions } from "../../redux/actions";
import { WorkspaceActions } from "../../../workspace/redux/actions";
import { EntityForm } from "../../components/EntityForm/EntityForm";
import { v4 } from 'uuid';
import I18n from '../../../i18n/components/i18n';
import { PrimaryButton } from '../../../../ui-kissbot-v2/common';
import { ModalImportEntity } from './components/ModalImportEntity';


export class EntityCreateClass extends Component<EntityCreateProps, EntityState> {
    constructor(props: any) {
        super(props);
        this.state = {
            openModalImport: false,
        };
    }

    componentDidMount(): void {
        if (!this.props.selectedWorkspace) {
            this.setSelectedWorkspace();
        } else if (isEmpty(this.props.entityCurrent)) {
            this.setCurrentEntity(this.props.selectedWorkspace);
        }
    }

    setSelectedWorkspace = async () => {
        let workspaceList: Workspace[];
        if (!this.props.workspaceList) {
            const paginated = await WorkspaceService.getWorkspaceList();
            workspaceList = paginated ? paginated.data : [];
            await this.props.setWorkspaceListNotAsync(workspaceList);
        } else {
            workspaceList = this.props.workspaceList;
        }
        await this.setCurrentEntity(workspaceList[0]);

        if (!!workspaceList?.[0]) {
            this.props.setSelectedWorkspace(workspaceList[0]);
        }
    };

    setCurrentEntity = (workspace: Workspace) => {
        const params: any = this.props.match.params;
        if (params.id === "create") {
            const entity = {
                workspaceId: "",
                params: undefined,
                entries: [{ synonyms: [], _id: v4(), name: "", entryAttributes: [] }],
                name: "",
                entityAttributes: []
            };
            this.props.setCurrentEntity(entity);
        } else if (!isEmpty(params.id) && params.id !== "create") {
            EntityService.getEntityById(workspace._id, params.id).then(success => {
                if (success) {
                    this.props.setCurrentEntity(success)
                } else {
                    this.props.history.push('/not-found')
                }
            })
        }
    }

    render() {
        const { getTranslation } = this.props;

        return <Page className="EntityCreate">
            <ModalImportEntity 
                closeModal={() => this.setState({openModalImport: false})}
                modalOpen={this.state.openModalImport}
                workspaceList={this.props.workspaceList}
                entityCurrent={this.props.entityCurrent}
                getTranslation={(text) => getTranslation(text)}
                setCurrentEntity={(entity) => this.props.setCurrentEntity(entity)}
            />
            <div className="row">
                <div className=" entities-group-title">
                    <h4>
                        {getTranslation('Entities')}
                    </h4>
                    <PrimaryButton
                        style={{ marginRight: '35px' }}
                        onClick={() => this.setState({ openModalImport: true })}
                    >{getTranslation('Importar')}</PrimaryButton>
                </div>
            </div>
            <div className="jumbotron custom">
                <div className="row">
                    <div className="col-lg-12">
                        {this.props.entityCurrent ? <EntityForm /> : getTranslation("Entity not found!!!")}
                    </div>
                </div>
            </div>
        </Page>
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    entityCurrent: state.entityReducer.entityCurrent,
    entitiesList: state.entityReducer.entitiesList,
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
    workspaceList: state.workspaceReducer.workspaceList
});

export const EntityCreate = I18n(withRouter(connect(
    mapStateToProps, {
    setCurrentEntities: EntityActions.setCurrentEntities,
    setCurrentEntity: EntityActions.setCurrentEntity,
    setSelectedWorkspace: WorkspaceActions.setSelectedWorkspace,
    setWorkspaceListNotAsync: WorkspaceActions.setWorkspaceListNotAsync
}
)(EntityCreateClass)));
