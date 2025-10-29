import { FC } from 'react';
import { Wrapper } from '../../ui-kissbot-v2/common';

interface NoResultsProps { 
    text: string;
}

const NoResults: FC<NoResultsProps> = ({ text }) => {
    

    return <Wrapper padding='20px 40px'>
        <Wrapper flexBox margin='30px 0 0 0' justifyContent='center'>
            <img style={{ height: '150px' }} src='assets/img/empty_draw.svg' />
        </Wrapper>
        <Wrapper flexBox textAlign='center' margin='30px 0'>
            {text}
        </Wrapper>
        <Wrapper flexBox justifyContent='center' margin='50px 20px' />
    </Wrapper>
};

export default NoResults;
