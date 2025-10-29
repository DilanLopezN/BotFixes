import { FC, useState } from 'react';
import { PageTemplate } from '../../../../shared-v2/page-template';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import FallbackFilter, { getDefaultFallbackFilter } from './components/FallbackFilter';
import { FallbackFilterInterface } from './components/FallbackFilter/props';
import FallbackList from './components/FallbackList';
import { TabFallbackProps } from './props';

const TabFallback: FC<TabFallbackProps & I18nProps> = ({ selectedWorkspace, getTranslation }) => {
    const [filter, setFilter] = useState<FallbackFilterInterface>(getDefaultFallbackFilter());

    return (
        <PageTemplate>
            <FallbackFilter initialFilter={filter} onSubmit={(filter) => setFilter({ ...filter })} disable={false} />
            <FallbackList selectedWorkspace={selectedWorkspace} appliedFilters={filter} />
        </PageTemplate>
    );
};

export default i18n(TabFallback) as FC<TabFallbackProps>;
