import styled from 'styled-components';
import UserAvatarProps from './props';

const Wrapper = styled.div<any>`
    width: fit-content;

    ${(props) =>
        !!props.margin &&
        `
    margin: ${props.margin};
  `}

    & svg, img {
        width: ${(props) => (!props.size ? '40px' : `${props.size}px`)};
        height: ${(props) => (!props.size ? '40px' : `${props.size}px`)};
        border-radius: 50%;
    }
`;

const stringToColor = (str) => {
    const colors = [
        '#40407a',
        '#706fd3',
        '#34ace0',
        '#33d9b2',
        '#2c2c54',
        '#474787',
        '#aaa69d',
        '#227093',
        '#218c74',
        '#ff5252',
        '#ff793f',
        '#ffb142',
        '#ffda79',
        '#b33939',
        '#cd6133',
        '#84817a',
        '#cc8e35',
        '#ccae62',
    ];

    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }

    hash = ((hash % colors.length) + colors.length) % colors.length;
    return colors[hash];
};

const getFontSize = (size) =>
    ({
        18: '12px',
        24: '15px',
        30: '17px',
        32: '19px',
        33: '19px',
        37: '22px',
        39: '22px',
        35: '22px',
        40: '22px',
        43: '24px',
        45: '28px',
        50: '32px',
        55: '35px',
        60: '40px',
        150: '100px',
        190: '120px',
    }[size]);

const getYSize = (size) =>
    ({
        18: '13',
        24: '16',
        32: '23',
    }[size]);

const UserAvatar = ({ user: { name, avatar }, size, margin, hashColor, style, id }: UserAvatarProps) => {
    name = name || 'anonymous';

    let firstLetter = name.charAt(0).toUpperCase();
    firstLetter = firstLetter === '(' ? 'A' : firstLetter;

    return (
        <Wrapper title={name && name} size={size} style={style} margin={margin}>
            {!!avatar ? (
                <img id={id} src={avatar} alt='User avatar' />
            ) : (
                <svg height={!!size ? `${size}` : '40'} width={!!size ? `${size}` : '40'}>
                    <rect
                        fill={stringToColor(hashColor || name).toString()}
                        x='0'
                        y='0'
                        height={!!size ? `${size}` : '40'}
                        width={!!size ? `${size}` : '40'}
                    ></rect>
                    <text
                        fill='#FFF'
                        fontSize={!!size ? getFontSize(size) : '25px'}
                        fontWeight='500'
                        textAnchor='middle'
                        x={!!size ? `${size / 2}` : '20'}
                        y={!!size ? getYSize(size) || `${(size / 4) * 3}` : '30'}
                    >
                        {firstLetter}
                    </text>
                </svg>
            )}
        </Wrapper>
    );
};

export default UserAvatar;
