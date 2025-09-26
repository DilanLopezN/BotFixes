import { RouteComponentProps } from 'react-router';
import { Interaction } from '../../../../model/Interaction';
import { Team } from '../../../../model/Team';
import { fieldSearchType } from '../../redux/redux-interface';
import { I18nProps } from './../../../i18n/interface/i18n.interface';

export interface ZoomBarProps extends RouteComponentProps, I18nProps {
    onCollapse: (isCollapsed) => any;
    setSearchInteraction: (...params) => any;
    onZoom: (zoom: number) => any;
    getTreeCollapsedLocal: Function;
    collapseType: 'expanded' | 'collapsed';
    interactionSearch: {value: string, field: fieldSearchType};
    workspaceId: string;
    interactionList : Array<Interaction>;
}

export interface ZoomBarState {
    zoom: number;
    teams: Team[];
}
