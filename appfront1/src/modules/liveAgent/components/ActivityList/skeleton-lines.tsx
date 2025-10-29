import { Skeleton } from 'antd';
import { Wrapper } from '../../../../ui-kissbot-v2/common';

export const SkeletonLines = () => {
    const array = new Array(7).fill(null);
    return (
        <div>
            {array.map((_, index) => {
                return (
                    <Wrapper
                        key={`skeleton:activity:${index}`}
                        bgcolor='#fff'
                        padding='8px 15px'
                        borderBottom='1px solid #F0F0F0'
                        margin='0'
                        height='70px'
                    >
                        <Skeleton active={true} title={false} paragraph={{ rows: 2 }} />
                    </Wrapper>
                );
            })}
        </div>
    );
};
