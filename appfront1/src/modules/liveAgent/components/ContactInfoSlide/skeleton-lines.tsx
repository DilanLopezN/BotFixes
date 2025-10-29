import { Skeleton } from 'antd';
import { Wrapper } from '../../../../ui-kissbot-v2/common';

export const SkeletonLines = () => {
    return (
        <div>
            <Wrapper
                key={`skeleton:contact:`}
                padding='8px 15px'
                bgcolor='#FFF'
                borderBottom='1px solid #F0F0F0'
                margin='0'
            >
                <Skeleton avatar active={true} title={false} paragraph={{ rows: 2 }} />
                <div style={{ width: '100%' }}>
                    <Skeleton active={true}  paragraph={{ rows: 2 }} />
                </div>
            </Wrapper>
        </div>
    );
};
