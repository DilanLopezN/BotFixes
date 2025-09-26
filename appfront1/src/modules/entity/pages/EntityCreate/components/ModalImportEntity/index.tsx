import { Component } from 'react'
import { EntityService } from '../../../../services/EntityService';
import { ModalImportEntityProps, ModalImportEntityState } from './props'
import { Modal } from '../../../../../../shared/Modal/Modal';
import { ModalPosition } from '../../../../../../shared/Modal/ModalProps';
import { SimpleSelect } from '../../../../../../shared/SimpleSelect/SimpleSelect';
import { ColorType } from '../../../../../../ui-kissbot-v2/theme';
import { PrimaryButton } from '../../../../../../ui-kissbot-v2/common';

export class ModalImportEntityClass extends Component<ModalImportEntityProps, ModalImportEntityState> {
    constructor(props: any) {
        super(props);
        this.state = {
            entityList: undefined,
            workspaceId: '',
            entitySelected: undefined,
        };
    }

    getEntityList = async (workspaceId: string) => {
        const entities = await EntityService.getEntityList(workspaceId)
        this.setState({  entityList: entities.data })
    }

    importEntity = () => {
        const { entityCurrent, setCurrentEntity } = this.props
        const { entitySelected } = this.state

        if(entitySelected) {
            if(entityCurrent._id){
                let newEntries: any[] = entityCurrent.entries
                entitySelected.entries.forEach(e => {
                    const index = newEntries.findIndex(el => el.name === e.name)
                    if(index > -1){
                        newEntries.splice(index, 1, {...entityCurrent.entries[index], synonyms: Array.from(new Set([...entityCurrent.entries[index].synonyms, ...e.synonyms]))})
                    }else {
                        newEntries.push({...e})
                    }
                        
                    })

                setCurrentEntity({
                    ...entityCurrent, 
                    entries: newEntries
                })
                return this.props.closeModal()
            }

            setCurrentEntity({
                ...entityCurrent, 
                name: entitySelected.name,
                entries: [...entityCurrent.entries, ...entitySelected.entries]
            })

            return this.props.closeModal()
        }
    }
    
    render() {
        return (
            <Modal
            onClickOutside={() => {
                this.setState({
                    ...this.state,
                    workspaceId: '',
                    entityList: undefined,
                    entitySelected: undefined
                })
                return this.props.closeModal()
            }}
                width='380px'
                height='240px'
                isOpened={this.props.modalOpen}
                position={ModalPosition.center}
            >
                <div style={{ 
                    width: '360px', 
                    height: '100%',
                    margin: '10px'
                    }}>
                    <div style={{height: '145px', margin: '10px'}}>
                    <label>{`${this.props.getTranslation('Select one')} workspace`}</label>
                    <SimpleSelect value={this.state.workspaceId} onChange={event => {
                        event.preventDefault()
                        if(event.target.value === '') {
                            return this.setState({ workspaceId: '', entityList: undefined})
                        }

                        this.setState({
                             
                            workspaceId: event.target.value, 
                            entitySelected: undefined, 
                            entityList: undefined
                        })
                        this.getEntityList(event.target.value)
                    }}>
                        <option value={''}>{this.props.getTranslation('Select option')}</option>
                        {this.props.workspaceList?.map((workspace) => {
                            return <option
                                value={workspace._id}
                                key={workspace._id}
                            >
                                {workspace.name}
                            </option>
                        })}
                    </SimpleSelect>
                    {
                        this.state.entityList &&
                        <div style={{margin: '10px 0 0 0'}}>
                            <label>{this.props.getTranslation('Select entity')}</label>
                            <SimpleSelect onChange={event => {
                                event.preventDefault()
                                if(event.target.value === '') {
                                    return this.setState({ entitySelected: undefined})
                                }

                                this.setState({ 
                                    entitySelected: this.state.entityList?.find(e => e._id === event.target.value)
                                })
                            }}>
                                <option value={''}>{this.props.getTranslation('Select option')}</option>
                                {this.state.entityList.map((entity) => {
                                    return <option
                                        value={entity._id}
                                        key={entity._id}
                                    >
                                        {entity.name}
                                    </option>
                                })}
                            </SimpleSelect>
                        </div>
                    }
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', padding: '10px'}}>
                    <PrimaryButton 
                        colorType={ColorType.text}
                        onClick={() => {
                            this.setState({
                                ...this.state,
                                workspaceId: '',
                                entityList: undefined,
                                entitySelected: undefined
                            })
                            return this.props.closeModal()
                        }}
                    >{this.props.getTranslation('Cancel')}</PrimaryButton>
                    <PrimaryButton
                        disabled={this.state.entitySelected ? false : true}
                        onClick={() => {
                            this.importEntity()
                        }}
                    >{this.props.getTranslation('Import')}</PrimaryButton>
                    </div>
                </div>
            </Modal>
        )
    }
}

export const ModalImportEntity = (ModalImportEntityClass)
