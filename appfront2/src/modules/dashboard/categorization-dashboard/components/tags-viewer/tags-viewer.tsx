import { useTranslation } from 'react-i18next';
import { Popover, Space, Tag } from 'antd';
import { localeKeys } from '~/i18n';
import type { TagViewerProps } from './interfaces';

export const TagViewer = ({ tags }: TagViewerProps) => {
  const { t } = useTranslation();

  const tagsViewerLocaleKeys = localeKeys.dashboard.categorizationDashboard.components.tagsViewer;

  const popoverContent = (
    <Space direction='vertical'>
      {tags ? (
        tags.map((tag) => {
          return <Tag key={tag}>{tag}</Tag>;
        })
      ) : (
        <span>{t(tagsViewerLocaleKeys.tagSpan)}</span>
      )}
    </Space>
  );

  return (
    <Popover content={popoverContent} title={t(tagsViewerLocaleKeys.titleTags)} placement='bottom'>
      <span style={{ color: '#1890ff', textDecoration: 'underline', cursor: 'pointer' }}>
        {t(tagsViewerLocaleKeys.popoverSpan)}
      </span>
    </Popover>
  );
};
