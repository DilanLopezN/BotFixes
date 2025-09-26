import { Component } from 'react';
import './Tree.scss';
import { TreeProps, TreeState } from './TreeProps';
import { Interaction, InteractionType } from '../../../../../model/Interaction';
import { TreeNode } from '../TreeNode/TreeNode';
import { connect } from 'react-redux';
import LoaderTree from '../../../../../shared/Loaders/LoaderTree/LoaderTree/LoaderTree';

class TreeClass extends Component<TreeProps, TreeState> {
    constructor(props: TreeProps) {
        super(props);
        this.state = {
            welcome: {},
        };
    }

    componentWillReceiveProps(props: TreeProps) {
        this.findWelcome(props.interactionList);
    }

    componentDidMount() {
        this.findWelcome(this.props.interactionList);
    }

    private findWelcome = (interactionList: Array<Interaction>) => {
        if (interactionList) {
            const welcome = interactionList.find(
                (interaction: Interaction) => interaction.type == InteractionType.welcome
            );
            this.setState({ welcome });
        }
    };

    render() {
        const { failedResponseIds } = this.props;
        return (
            <div className='Tree'>
                {this.props.interactionList && this.props.interactionList.length >= 2 && this.state.welcome ? (
                    <TreeNode interaction={this.state.welcome} failedResponseIds={failedResponseIds} />
                ) : (
                    <LoaderTree />
                )}
            </div>
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    interactionList: state.botReducer.interactionList,
});

export const Tree = connect(mapStateToProps, {})(TreeClass) as any;
