import { Component } from 'react';
import { ZoomBarProps, ZoomBarState } from './ZoomBarProps';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { BotActions } from '../../redux/actions';
import I18n from '../../../i18n/components/i18n';
import debounce from 'lodash/debounce';
import { Input, Radio, Select } from 'antd';
import { fieldSearchType } from '../../redux/redux-interface';
import { TeamService } from '../../../teams/services/TeamService';
import { orderBy } from 'lodash';

class ZoomBarClass extends Component<ZoomBarProps, ZoomBarState> {
    constructor(props: ZoomBarProps) {
        super(props);
        this.state = {
            zoom: 90,
            teams: [],
        };
    }

    componentDidMount() {
        this.props.setSearchInteraction('');
    }

    getWorkspaceTeams = async () => {
        if (this.state.teams.length) {
            return;
        }

        const response = await TeamService.getTeams(this.props.workspaceId);
        if (!!response?.data) {
            this.setState({ teams: response.data });
        }
    };

    private onZoomIn = () => {
        let zoom = this.state.zoom;
        if (zoom + 5 <= 100) {
            zoom += 5;
        }
        this.setState({ zoom }, () => {
            this.props.onZoom(this.state.zoom);
        });
    };

    private onZoomOut = () => {
        let zoom = this.state.zoom;
        if (zoom - 5 >= 50) {
            zoom -= 5;
        }
        this.setState({ zoom }, () => this.props.onZoom(this.state.zoom));
    };

    collapsed = (param) => {
        const params: any = this.props.match.params;
        const localStorageTreeCollapsed = this.props.getTreeCollapsedLocal();

        if (param === true) {
            if (localStorageTreeCollapsed?.[params.workspaceId]?.[params.botId].collapsed === true) {
                return this.props.onCollapse(null);
            } else {
                return this.props.onCollapse(true);
            }
        }

        if (localStorageTreeCollapsed?.[params.workspaceId]?.[params.botId].collapsed === false) {
            return this.props.onCollapse(null);
        } else {
            return this.props.onCollapse(false);
        }
    };

    handleOptions = (options, interactionTypeToShow) => {
        const filtered = orderBy(
            (options ?? []).filter(
                (interaction) => interactionTypeToShow && interactionTypeToShow.includes(interaction.type)
            ),
            ['type', 'name'],
            ['desc', 'asc']
        );

        return filtered.map((interaction) => ({
            label: interaction.name || interaction.type,
            value: interaction._id,
        }));
    };

    render() {
        const { getTranslation, setSearchInteraction, interactionSearch } = this.props;
        const options = [
            { label: getTranslation('Name'), value: fieldSearchType.name },
            { label: getTranslation('Tag'), value: fieldSearchType.tag },
            { label: getTranslation('Go to'), value: fieldSearchType.goto },
            { label: getTranslation('Team'), value: fieldSearchType.team },
            { label: getTranslation('Text'), value: fieldSearchType.text },
        ];

        return (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', margin: '5px 0' }}>
                <div style={{ display: 'flex' }}>
                    <Select
                        style={{ width: '150px' }}
                        value={interactionSearch.field || fieldSearchType.name}
                        onChange={(value) => {
                            if (value === fieldSearchType.team) {
                                this.getWorkspaceTeams();
                            }
                            setSearchInteraction({ field: value, value: '' });
                        }}
                        options={options}
                    />
                    {interactionSearch.field === fieldSearchType.team ? (
                        <Select
                            showSearch
                            allowClear
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            style={{ width: '300px' }}
                            value={interactionSearch.value}
                            onChange={(value) => setSearchInteraction({ ...interactionSearch, value: value })}
                            options={this.state.teams.map((team) => ({ label: team.name, value: team._id }))}
                        />
                    ) : interactionSearch.field === fieldSearchType.goto ? (
                        <Select
                            showSearch
                            allowClear
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            style={{ width: '300px' }}
                            value={interactionSearch.value}
                            onChange={(value) => setSearchInteraction({ ...interactionSearch, value: value })}
                            options={this.handleOptions(this.props.interactionList, [
                                'interaction',
                                'welcome',
                                'fallback',
                            ])}
                        />
                    ) : interactionSearch.field === fieldSearchType.text ? (
                        <Input.Search
                            style={{ width: '300px' }}
                            autoFocus
                            placeholder={getTranslation('Search')}
                            onChange={debounce((event) => {
                                setSearchInteraction({
                                    value: event.target.value,
                                    field: interactionSearch.field || fieldSearchType.text,
                                });
                            }, 400)}
                        />
                    ) : (
                        <Input.Search
                            style={{ width: '300px' }}
                            autoFocus
                            placeholder={getTranslation('Search')}
                            onChange={debounce((event) => {
                                setSearchInteraction({
                                    value: event.target.value,
                                    field: interactionSearch.field || fieldSearchType.name,
                                });
                            }, 400)}
                        />
                    )}
                </div>
                <Radio.Group value={this.props.collapseType} style={{ marginLeft: 15, marginRight: 15 }}>
                    <Radio.Button
                        value='collapsed'
                        onClick={() => {
                            this.collapsed(true);
                        }}
                    >
                        {getTranslation('Collapse all')}
                    </Radio.Button>
                    <Radio.Button
                        value='expanded'
                        onClick={() => {
                            this.collapsed(false);
                        }}
                    >
                        {getTranslation('Expand all')}
                    </Radio.Button>
                </Radio.Group>
                <Radio.Group value={'large'}>
                    <Radio.Button onClick={this.onZoomOut}>-</Radio.Button>
                    <Radio.Button disabled>
                        <span>{this.state.zoom}%</span>
                    </Radio.Button>
                    <Radio.Button onClick={this.onZoomIn}>+</Radio.Button>
                </Radio.Group>
            </div>
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    interactionSearch: state.botReducer.interactionSearch,
    interactionList: state.botReducer.interactionList,
});

export const ZoomBar = I18n(
    withRouter(
        connect(mapStateToProps, {
            setSearchInteraction: BotActions.setSearchInteraction,
        })(ZoomBarClass)
    )
) as any;
