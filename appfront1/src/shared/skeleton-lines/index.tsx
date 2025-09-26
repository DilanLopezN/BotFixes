import { Skeleton } from 'antd';
import { FC } from 'react';
import { Wrapper } from '../../ui-kissbot-v2/common';

export interface SkeletonLinesProps {
    size?: number;
    style: React.CSSProperties;
    rows: number;
}

const SkeletonLines: FC<SkeletonLinesProps> = ({ size, style, rows }) => {
    const array = new Array(size ?? 6).fill(null);
    return (
        <>
            {array.map((_, index) => {
                return (
                    <Wrapper
                        key={`skeleton:${index}`}
                        bgcolor='#fff'
                        style={style}
                    >
                        <Skeleton active={true} title={false} paragraph={{ rows }} />
                    </Wrapper>
                );
            })}
        </>
    );
};

export default SkeletonLines;
