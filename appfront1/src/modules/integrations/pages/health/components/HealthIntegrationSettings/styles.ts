import { Timeline } from 'antd';
import styled from 'styled-components';

export const CustomTimeline = styled(Timeline)`
    .ant-timeline-item {
        padding-bottom: 0px;
        margin-bottom: 4px;
    }
`;
export const CustomLastTimelineItem = styled(Timeline.Item)`
    &.ant-timeline-item-last > .ant-timeline-item-content {
        min-height: 32px;
    }
`;
export const MenuBodyWrap = styled('div')`
    margin: 0 auto;
    padding: 20px;
    max-width: 1100px;
`;
