import { Component } from 'react';
import { LabelsTabProps, LabelsTabState } from './LabelsTabProps';
import './LabelsTab.scss';
import difference from 'lodash/difference';
import isEmpty from 'lodash/isEmpty';
import { StyledInput } from '../../../../../shared/StyledForms/StyledField/StyledField';
import { LabelWrapper } from '../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { BotActions } from '../../../redux/actions';
import { BotLabel } from '../../../../../model/Bot';
import { Interaction } from '../../../../../model/Interaction';
import { DisabledTypeContext } from '../../../contexts/disabledFieldsContext';

class LabelsClass extends Component<LabelsTabProps, LabelsTabState> {
    constructor(props) {
        super(props);
        this.state = {
            optionModalList: 'list',
            onSearchTitleLabel: '',
        };
    }

    onChange = (values) => {
        const currentBot = this.props.currentBot;
        currentBot.labels = values;
        this.props.setCurrentBot(currentBot);
    };

    searchTitleLabel = (event) => {
        this.setState({
            ...this.state,
            onSearchTitleLabel: event.target.value,
        });
    };

    isVisibled = (type: string) => {
        return this.state.optionModalList !== type ? 'display-none' : '';
    };

    selectedItem = (label: BotLabel) => {
        let currentInteraction: Interaction = this.props.currentInteraction;
        if (!currentInteraction.labels.find((element) => element === label._id)) {
            currentInteraction.labels.push(label._id);
        } else {
            currentInteraction.labels = difference(currentInteraction.labels, [label._id]);
        }
        this.props.setCurrentInteraction(currentInteraction);
        this.forceUpdate();
    };

    onSearchTitleLabel = (name, nameColor) => {
        const { currentBot } = this.props;
        if (!currentBot.labels) return null;
        const validString = (nameRecept) => nameRecept.toLowerCase().indexOf(this.state.onSearchTitleLabel) > -1;

        return validString(name) || validString(nameColor);
    };

    render() {
        return (
            <div className='modal-interaction-content Labels card'>
                <div className={this.isVisibled('list') + ' wrapper'}>
                    <div className='row'>
                        <div className='col-12'>
                            <LabelWrapper asTitle={true} label='Search'>
                                <DisabledTypeContext.Consumer>
                                    {({ disabledFields }) => {
                                        return (
                                            <StyledInput
                                                disabled={disabledFields}
                                                type='text'
                                                autoComplete='off'
                                                placeholder='Search'
                                                name='name'
                                                onChange={(event) => {
                                                    this.searchTitleLabel(event);
                                                }}
                                            />
                                        );
                                    }}
                                </DisabledTypeContext.Consumer>
                            </LabelWrapper>
                        </div>
                    </div>
                    <hr />
                    <div className='row '>
                        {this.props.currentBot && this.props.currentBot.labels
                            ? this.props.currentBot.labels.map((label: BotLabel, index) => {
                                  const idExist =
                                      this.props.currentInteraction && this.props.currentInteraction.labels
                                          ? this.props.currentInteraction.labels.filter((ele) => ele === label._id)
                                          : [];
                                  let isVisbled = '';
                                  if (!this.onSearchTitleLabel(label.name, label.color.name)) {
                                      isVisbled = 'display-none';
                                  }
                                  return (
                                      <div
                                          className={'col-12 container-labels ' + isVisbled}
                                          key={index}
                                          onClick={() => this.selectedItem(label)}
                                      >
                                          <div className='container-icons'>
                                              {!isEmpty(idExist) ? (
                                                  <span className='mdi mdi-checkbox-marked i-selected' />
                                              ) : (
                                                  <span className='mdi mdi-checkbox-blank-outline i-no-selected' />
                                              )}
                                          </div>
                                          <div className='card' key={index}>
                                              <div
                                                  className='card-body'
                                                  style={{ background: `${label.color.hexColor}` }}
                                              >
                                                  <p className='name-label'>{label.name || label.color.name}</p>
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })
                            : null}
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    currentBot: state.botReducer.currentBot,
    currentInteraction: state.botReducer.currentInteraction,
});
export const LabelsTab = withRouter(
    connect(mapStateToProps, {
        setCurrentBot: BotActions.setCurrentBot,
        setCurrentInteraction: BotActions.setCurrentInteraction,
    })(LabelsClass)
);
