import { Component } from 'react';
import './LabelWrapper.scss';
import { LabelWrapperProps } from './LabelWrapperProps';
import { v4 } from 'uuid';
import { getIn } from 'formik';
import isArray from 'lodash/isArray';

export class LabelWrapper extends Component<LabelWrapperProps> {
    renderTooltip = () => {
        if (!this.props.tooltip) return null;
        return (
            <span className='tooltip-container'>
                <div
                    className='help-tooltip'
                    style={this.props?.tooltipStyle?.rightDirection ? { right: '-2px' } : {}}
                    key={v4()}
                >
                    <div
                        className={`help-tooltip-content ${
                            this.props?.tooltipStyle?.rightDirection ? 'right-tooltip' : ''
                        }`}
                        style={{ ...this.props.tooltipStyle }}
                    >
                        {this.props.tooltip}
                    </div>
                </div>
                <span className='mdi mdi-help-circle-outline' key={v4()} />
            </span>
        );
    };

    getTitleClass = () => {
        if (this.props.asTitle) return 'title-label';
        return null;
    };

    getErrorClass = () => {
        if (!this.props.validate) return;
        const error = getIn(this.props.validate.errors, this.props.validate.fieldName);
        const touch = getIn(this.props.validate.touched, this.props.validate.fieldName);
        const ignoreError = this.props.validate.ignoreErrorMessage;
        if ((touch || this.props.validate.isSubmitted) && error) return 'invalid';
        if ((touch || this.props.validate.isSubmitted) && error && ignoreError) return 'invalid';
    };

    renderErrorPopup = () => {
        if (!this.props.validate) return;
        if (this.getErrorClass() != 'invalid') return null;
        const error = getIn(this.props.validate.errors, this.props.validate.fieldName);
        return (
            <div className='error-popup-container'>
                <div className='error-popup alert alert-danger'>{!isArray(error) ? error : error[0]?.value}</div>
            </div>
        );
    };

    renderLabel = () => {
        if (!this.props.label) return null;
        return (
            <div className={'label-container ' + this.getTitleClass()}>
                <label className='no-margin'>{this.props.label}</label>
                {this.renderTooltip()}
            </div>
        );
    };

    render() {
        return (
            <div className='LabelWrapper'>
                {this.renderLabel()}
                {this.renderErrorPopup()}
                <div className={'LabelWrapper--content ' + this.getErrorClass()}>{this.props.children}</div>
            </div>
        );
    }
}
