import { FC, useState } from 'react';
import styled from 'styled-components';

const Count = styled.div`
    font-weight: 600;
    font-size: 10px;
    position: absolute;
    background: #06d755;
    display: flex;
    flex-direction: row;
    align-items: center;
    width: auto;
    min-width: 18px;
    margin: 0px 3px 0px 4px;
    padding: 0.4em;
    border-radius: 1.1em;
    text-align: center;
    height: 16px;
    color: #fff;
    right: -3px;
    bottom: -11px;
    display: flex;
    justify-content: center;

    .countMax {
        font-weight: 600;
        color: #fff;
        font-size: 10px;
    }

    .valueCount {
        font-weight: 600;
        color: #fff;
        font-size: 10px;
    }
`;

interface CountInfoProps {
    count: number;
}

const CountInfo: FC<CountInfoProps> = ({ count }) => {
    const [showCount, setShowCount] = useState(false);
    return (
        <Count>
            {count > 99 ? (
                showCount ? (
                    <div className={'valueCount'} onMouseLeave={() => setShowCount(false)}>
                        {count}
                    </div>
                ) : (
                    <div className={'countMax'} onMouseEnter={() => setShowCount(true)}>
                        99+
                    </div>
                )
            ) : (
                count
            )}
        </Count>
    );
};

export default CountInfo;
