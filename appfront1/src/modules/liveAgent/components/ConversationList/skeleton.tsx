import React from 'react'
import { Skeleton } from 'antd'
import { Wrapper } from '../../../../ui-kissbot-v2/common';

const SkeletonLines = () => {
    const array = new Array(5).fill(null);
    return <div>
        {array.map((_, index) => {
            return <Wrapper
                key={`skeleton:conversation:${index}`}
                bgcolor='#fff'
                padding='13px 15px'
                borderBottom='1px solid #F0F0F0'
                margin='0 0 10px 0'
                height='83px'>
                <Skeleton
                    avatar
                    active={true}
                    title={false}
                    paragraph={{ rows: 2 }}
                />
            </Wrapper>
        })}
    </div>
}

export default SkeletonLines;