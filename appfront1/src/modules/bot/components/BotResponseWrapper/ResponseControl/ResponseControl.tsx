import React, { Component } from "react";
import "./ResponseControl.scss";
import { ResponseControlProps, ResponseControlState } from "./ResponseControlProps";
import { BotResponseMoveDirection } from "../BotResponseWrapper/BotResponseWrapperProps";
import { connect } from "react-redux";
import { BotActions } from "../../../redux/actions";
import { withRouter } from "react-router";
import I18n from "../../../../i18n/components/i18n";
import { Checkbox } from "antd";
import { fixedResponses } from "../../../../../model/ResponseElement";

class ResponseControlClass extends Component<ResponseControlProps, ResponseControlState> {
  constructor(props) {
    super(props);
    this.state = {
      idInteractionCopy: this.listOptions()
    };
  }
  renderUpArrow = () => {
    if (!this.props.isShowUpArrow) return null;
    return <div className="control-btn" onClick={() => this.props.onMoveInteraction(BotResponseMoveDirection.UP)}
      title="Move up">
      <span className="mdi mdi-24px mdi-arrow-up" />
    </div>;
  };

  renderDownArrow = () => {
    if (!this.props.isShowDownArrow) return null;
    return <div className="control-btn" onClick={() => this.props.onMoveInteraction(BotResponseMoveDirection.DOWN)}
      title="Move down">
      <span className="mdi mdi-24px mdi-arrow-down" />
    </div>;
  };

  listOptions = () => {
    const options: any = [];
    this.props.interactionList && this.props.interactionList.map((interaction) => {
      if (interaction.type !== "fallback" && interaction.type !== "context-fallback"
        && interaction._id !== this.props.currentInteraction._id) {
        options.push(interaction._id);
      }
    });
    return options[0];
  };

  onChange = (_id) => {
    this.setState({
      ...this.state,
      idInteractionCopy: _id
    });
  };

  checked = () => {
    if (this.props.response._id) {
      if (this.props.idResponseList.includes(this.props.response._id)) {
        return true;
      } else {
        return false;
      }
    } else if(this.props.response.id){
      if (this.props.idResponseList.includes(this.props.response.id)) {
        return true;
      } else {
        return false;
      }
    }else {
      return false
    }
  }

  renderCheckBox = () => {
    const {response} = this.props
    const isValid = response.isResponseValid || response.isResponseValid === undefined;
    return <Checkbox
      checked={isValid ? this.checked() : false}
      disabled={!isValid}
      onChange={(event) => {
        this.props.checked(event.target.checked, response._id ? response._id : response.id)
      }} />
  }

  render() {
    const { getTranslation, response } = this.props;
    const showResponseControl = !fixedResponses.includes(response.type);

    return <div className="ResponseControl">
      {
        showResponseControl && (
          <>
            {this.renderUpArrow()}
            <div className="control-btn" onClick={this.props.onDelete} title={getTranslation('Delete')}>
              <span className="mdi mdi-24px mdi-delete-outline" />
            </div>
            <div className="control-btn" onClick={this.props.onClone}>
              <span className="mdi mdi-24px mdi-content-duplicate" title={getTranslation('Clone')} />
            </div>
            {this.renderCheckBox()}
            {this.renderDownArrow()}
          </>
        )
      }
    </div>;
  }
}

const mapStateToProps = (state: any, ownProps: any) => ({
  interactionList: state.botReducer.interactionList,
  selectedLanguage: state.botReducer.selectedLanguage,
  currentInteraction: state.botReducer.currentInteraction,
});

export const ResponseControl = I18n(withRouter(connect(
  mapStateToProps, {
  setInteractionList: BotActions.setInteractionList
}
)(ResponseControlClass)) as any);