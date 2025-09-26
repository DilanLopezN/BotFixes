import React, { Component } from 'react'
import { Entity } from 'kissbot-core';
import { withRouter, Link } from 'react-router-dom';
import { Icon, Wrapper } from '../../../../ui-kissbot-v2/common';
import { connect } from 'react-redux';
import './EntityCard.scss';
import { Workspace } from '../../../../model/Workspace';
import ContentCard from '../../../../shared/content-card';

interface EntityCardProps {
    onOpenModalDelete: (entityId: any) => any;
    onChangeEntityCurrent: (entityId: any) => any;
    entity: Entity;
    match?: any;
    history?: any;
    selectedWorkspace: Workspace;
}

interface EntityCardState {
    selected: boolean;
}

export default class EntityCardClass extends Component<EntityCardProps, EntityCardState> {
    constructor(props: Readonly<EntityCardProps>) {
        super(props);
        this.state = {
            selected: false,
        };
    }

    render() {
        const { entity } = this.props;
        return (
            <ContentCard
                selected={false}
                disabled={false}
                clickable={true}
                onClick={() => { }}
            >
                <Link 
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        height: '100%',
                        padding: '20px 20px 20px 0',
                        margin: '-15px 0'
                    }} 
                    to={`/workspace/${this.props.selectedWorkspace && this.props.selectedWorkspace._id}/entities/` + entity._id}
                    onClick={() => { this.props.onChangeEntityCurrent(this.props.entity) }} 
                >
                    <Icon 
                    name='database'
                    style={{color: '#3b5981', marginRight: '15px'}}
                    onClick={() => {
                        this.props.onChangeEntityCurrent(entity);
                        this.props.onOpenModalDelete(true)
                    }}
                />
                    <Wrapper>{entity.name}</Wrapper>
                </Link>
                <Icon 
                    className={'deleteIcon'}
                    name='delete-outline'
                    onClick={() => {
                        this.props.onChangeEntityCurrent(entity);
                        this.props.onOpenModalDelete(true)
                    }}
                />
            </ContentCard>
        )
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export const EntityCard = withRouter(connect(
    mapStateToProps,
    {}
)(EntityCardClass)) as any;
