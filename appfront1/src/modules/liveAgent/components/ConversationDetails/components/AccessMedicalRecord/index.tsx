import { FC } from 'react';
import { AccessMedicalRecordProps } from './props';
import styled from 'styled-components';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';

const Input = styled.input`
    border: 1px #c7c7c7 solid;
    border-radius: 5px;
    padding: 4px 6px;
    width: 100%;
    &:disabled {
        background: #fff;
    }
`;

const AccessMedicalRecord: FC<AccessMedicalRecordProps & I18nProps> = ({ getTranslation, attribute }) => {
    const parsedValue = JSON.parse(attribute.value);
    const customProps: React.AnchorHTMLAttributes<HTMLAnchorElement> = {
        href: parsedValue?.params?.value ?? '#',
    };

    if (parsedValue?.params?.target) {
        customProps.target = parsedValue.params.target;
    }

    return (
        <>
            <Wrapper
                margin='9px 0 4px 5px'
                color='#444'
                fontSize='12px'
                title={`${getTranslation(`${attribute.label}`)}`}
            >
                {getTranslation(`${attribute.label}`)}
            </Wrapper>
            <Wrapper margin='0 5px' position='relative'>
                <Input
                    style={{
                        padding: '4px 20px 4px 6px',
                    }}
                    disabled
                    value={`${getTranslation('Access')} ${attribute.label}`}
                />
                <a {...customProps}>
                    <span
                        style={{
                            cursor: 'pointer',
                            position: 'absolute',
                            right: '3px',
                            fontSize: '19px',
                            top: '3px',
                        }}
                        title={getTranslation('Medical record')}
                        className='mdi mdi-clipboard-text-play-outline'
                    ></span>
                </a>
            </Wrapper>
        </>
    );
};

export default i18n(AccessMedicalRecord) as FC<AccessMedicalRecordProps>;
