import { FC, useMemo } from 'react';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { ActivityFromProps } from './props';

const ActivityFrom: FC<ActivityFromProps> = ({ renderTimestamp, activity, clientMessage, ownerMessage }) => {
    const { localTimestamp, timestamp, from, data } = activity;

    const displayName = useMemo(() => {
        if (data?.feature) {
            return data.feature.charAt(0).toUpperCase() + data.feature.slice(1);
        }
        if (from && !ownerMessage && from.type !== 'user') {
            return from.name;
        }
        return null;
    }, [data?.feature, from, ownerMessage]);

    return (
        <div>
            {(!!localTimestamp || !!timestamp) && renderTimestamp && (
                <Wrapper
                    flexBox
                    width='100%'
                    padding={!!clientMessage ? '5px 0 0 20px' : '3px 20px 0 0'}
                    justifyContent={!!clientMessage ? 'flex-start' : 'flex-end'}
                >
                    <Wrapper color='#656565' fontSize='12px' flexBox>
                        {displayName}
                    </Wrapper>
                </Wrapper>
            )}
        </div>
    );
};

export default ActivityFrom;
