import { Component } from 'react'
import './Toggle.scss';

interface ToggleProps {
    checked: boolean;
    onChange: (...params) => any;
    tabIndex?: any;
    disabled?: boolean;
    label?: string;
    margin?: string;
    tooltip?: string;
}

export default class Toggle extends Component<ToggleProps> {
    render() {
        return <>
            {this.props.label ?
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        margin: `${this.props.margin || '10px 0 10px 0'}`
                    }}>
                    <div>
                        <div className='Toggle' tabIndex={this.props.tabIndex}>
                            <div style={{ height: '23px' }}>
                                <label className="switch">
                                    <input
                                        disabled={this.props.disabled}
                                        checked={this.props.checked}
                                        type="checkbox"
                                        onChange={ev => this.props.onChange(ev.target.checked)} />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <div
                            style={{ margin: '0 0 0 10px' }}
                        >
                            {this.props.label}
                        </div>
                        {
                            this.props.tooltip &&
                            <span className="tooltip-container">
                                <div className="help-tooltip" key={this.props.tooltip}>
                                    <div className="help-tooltip-content">
                                        {this.props.tooltip}
                                    </div>
                                </div>
                                <span className="mdi mdi-help-circle-outline mdi-18px" key={this.props.tooltip} />
                            </span>
                        }
                    </div>
                </div>
                :
                <div className='Toggle' tabIndex={this.props.tabIndex}>
                    <div style={{ height: '23px' }}>
                        <label className="switch">
                            <input
                                disabled={this.props.disabled}
                                checked={this.props.checked}
                                type="checkbox"
                                onChange={ev => this.props.onChange(ev.target.checked)} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </div>
            }
        </>
    }
}
