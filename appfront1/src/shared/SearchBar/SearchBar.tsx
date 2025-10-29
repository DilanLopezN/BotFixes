import { Component } from 'react';
import { SearchBarProps } from './SearchBarProps';
import I18n from '../../modules/i18n/components/i18n';
import Search from 'antd/lib/input/Search';

class SearchBarClass extends Component<SearchBarProps> {
    render() {
        const { getTranslation } = this.props;

        return (
            <Search
                autoFocus
                type='text'
                placeholder={this.props.placeholder || getTranslation('Search')}
                aria-label='Search'
                onChange={this.props.onSearch}
            />
        );
    }
}

export const SearchBar = I18n(SearchBarClass);
