import React, { Component } from 'react';
import './TreeNode.scss';
import { TreeNodeProps, TreeNodeState } from './TreeNodeProps';
import { Interaction, InteractionType } from '../../../../../model/Interaction';
import { v4 } from 'uuid';
import { connect } from 'react-redux';
import { BotActions } from '../../../redux/actions';
import { withRouter } from 'react-router';
import { TreeBottom } from '../TreeBottom/TreeBottom';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import { TreeHeaderDraggableWrapper } from '../TreeHeaderDraggableWrapper/TreeHeaderDraggableWrapper';
import orderBy from 'lodash/orderBy';
import isEmpty from 'lodash/isEmpty';

enum positionLang {
    'pt-BR' = 0,
    'en' = 1,
    'es' = 2,
}
class TreeNodeClass extends Component<TreeNodeProps, TreeNodeState> {
    constructor(props: TreeNodeProps) {
        super(props);
        this.state = {
            interactionList: props.interactionList || [],
        };
    }

    componentWillReceiveProps(nextProps: TreeNodeProps) {
        this.setState({ interactionList: nextProps.interactionList || [] });
    }

    /**
     * A cada loop da recursividade essa função é chamada passando a interaction do loop
     * atual, então essa função retorna todos os filhos da interaction do loop atual para criar recursivamente os nós filhos
     */
    private findChildren = (interactionToGet: Interaction): Array<Interaction> => {
        let children;
        if (interactionToGet.type == 'welcome') {
            children = this.state.interactionList.filter((interaction: Interaction) => {
                return (
                    (!interaction.parentId || interaction.parentId == interactionToGet._id) &&
                    interaction.type != 'welcome' &&
                    interaction.type != 'fallback'
                );
            });
        } else {
            children = this.state.interactionList.filter((interaction: Interaction) => {
                return interaction.parentId == interactionToGet._id;
            });
        }
        children = children || [];
        children = orderBy(children, ['position'], ['asc']);
        return children;
    };

    /**
     * Função para renderizar todos os filhos de um interaction, é recursiva com a função renderInteraction();
     * Essa função busca o resultado de findChildren() e caso tenha venha um array maior que zero é iniciado um novo loop recursivo
     */
    private renderNodeChildren = (interaction: Interaction) => {
        if (interaction.reference) return null;
        const children = this.findChildren(interaction);

        return (
            <div className='node-children'>
                {children.map((childInteraction) => {
                    return this.renderInteraction(childInteraction);
                })}
            </div>
        );
    };

    /**
     * Retorna true caso a interaction exista no path da interaction que está sendo exibida no web chat
     * Usado para marcar se as interaciton está sendo executada no webchat
     *  */
    isOnExecutingPath = (interaction: Interaction): boolean => {
        return !!this.props.currentExecutingInteraction.find((pathItem) => interaction._id == pathItem);
    };

    /**
     * Retorna true caso a interaction seja a última no array de executing interaction
     * Usado para marcar apenas o rounded btn da interaction que está sendo executada
     */
    isExecuting = (interaction: Interaction): boolean => {
        return (
            this.props.currentExecutingInteraction[this.props.currentExecutingInteraction.length - 1] == interaction._id
        );
    };

    /**
     * Função que renderiza um interação. Recursiva com renderNodeChildren();
     */
    private renderInteraction = (interaction: Interaction) => {
        const { failedResponseIds } = this.props;
        const isOnExecutingPath = this.isOnExecutingPath(interaction);
        const isExecuting = this.isExecuting(interaction);
        if (interaction.type == InteractionType.fallback || interaction.type == InteractionType.contextFallback)
            return null;
        let className = 'TreeNode tree-node';
        if (interaction.type !== InteractionType.welcome) {
            className += ' leftLine ';
        }
        if (isOnExecutingPath) {
            className += ' executing ';
        }
        const validateSearch =
            this.validateSearch(interaction) || this.validateSearchInInteraction(interaction)
                ? className
                : className + ' display-none';

        return (
            <div className={validateSearch} key={v4()}>
                <TreeHeaderDraggableWrapper
                    isExecuting={isExecuting}
                    interaction={interaction}
                    failedResponseIds={failedResponseIds}
                />
                {interaction.isCollapsed ? null : this.renderNodeChildren(interaction)}
                <TreeBottom interaction={interaction} />
            </div>
        );
    };

    validateSearchInInteraction = (interactionParameter: Interaction) => {
        let isVisible = false;
        (this.props.interactionList || []).forEach((interaction: Interaction) => {
            if (interactionParameter.completePath) {
                interactionParameter.completePath.forEach((pathValue) => {
                    if (pathValue === interaction._id && this.validateSearch(interaction)) return (isVisible = true);
                });
            }

            if (isVisible) return true;

            if (interaction.completePath) {
                interaction.completePath.forEach((pathValue) => {
                    if (pathValue === interactionParameter._id && this.validateSearch(interaction))
                        return (isVisible = true);
                });
            }
        });
        return isVisible;
    };

    validateSearch = (interaction) => {
        const { interactionSearch } = this.props;

        if (isEmpty(interactionSearch.value)) return true;

        const SearchField = {
            name: this.searchFieldName,
            team: this.searchValue,
            goto: this.searchValue,
            tag: this.searchValue,
            text: this.searchValue,
        };

        if (interactionSearch.field === 'text') {
            return SearchField['text'](interaction) || SearchField['name'](interaction);
        }

        if (!!SearchField[interactionSearch.field]) {
            return SearchField[interactionSearch.field](interaction);
        }

        return false;
    };

    searchFieldName = (interaction) => {
        const { interactionSearch } = this.props;

        if (!interaction.name) {
            return false;
        }

        return interaction.name.toLowerCase().indexOf(interactionSearch.value.toLowerCase()) > -1;
    };

    searchValue = (interaction) => {
        const { interactionSearch, selectedLanguage } = this.props;

        try {
            const hasValue = (object, value) => {
                return Object.values(object).some((val) => {
                    if (String(val).toLowerCase().includes(value.toLowerCase())) {
                        return true;
                    }
                    if (val && typeof val === 'object') {
                        return hasValue(val, value);
                    }
                    if (val && Array?.isArray(val)) {
                        return val.some((obj) => {
                            return hasValue(obj, value);
                        });
                    }
                });
            };
            const languageSelected = positionLang[selectedLanguage];
            return hasValue(interaction.languages[languageSelected], interactionSearch.value);
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    render() {
        return this.renderInteraction(this.props.interaction);
    }
}

const TreeNodeDraggable = DragDropContext(HTML5Backend)(TreeNodeClass);

const mapStateToProps = (state: any, ownProps: any) => ({
    interactionList: state.botReducer.interactionList,
    currentExecutingInteraction: state.botReducer.currentExecutingInteraction,
    interactionSearch: state.botReducer.interactionSearch,
    selectedLanguage: state.botReducer.selectedLanguage,
});

export const TreeNode = withRouter(
    connect(mapStateToProps, {
        setInteractionList: BotActions.setInteractionList,
    })(TreeNodeDraggable)
) as any;
