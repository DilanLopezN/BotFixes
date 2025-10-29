import { FC, useEffect, useState } from 'react';
import { I18nProps } from '../../modules/i18n/interface/i18n.interface';
import i18n from '../../modules/i18n/components/i18n';
import { InfoErrorsPasswordProps } from './InfoErrorsPasswordProps';
import { Wrapper } from '../../ui-kissbot-v2/common';
import styled from 'styled-components';

const Info = styled(Wrapper)`
    background-color: #c9c9c9;
    border-radius: 50%;
    width: 15px;
    height: 15px;
    margin-right: 10px;
`;

export const InfoErrorsPassword: FC<InfoErrorsPasswordProps & I18nProps> = ({
    getTranslation,
    errors,
    fieldName,
    value,
    omitKeyErrors,
}) => {
    const [errorList, setErrorList] = useState<any[]>([]);

    const getErrors = () => {
        if (!omitKeyErrors?.length) {
            return setErrorList(errors.fields?.[fieldName].tests.map((el) => el.OPTIONS));
        }

        return setErrorList(
            errors.fields?.[fieldName].tests.map((el) => el.OPTIONS).filter((opt) => !omitKeyErrors.includes(opt.name))
        );
    };

    useEffect(() => {
        getErrors();
    }, [errors]);

    return (
        <Wrapper>
            {errorList.map((error) => {
                return error.name === 'required' ? (
                    <Wrapper flexBox alignItems='center' color={`${value !== '' ? '#059669' : '#c9c9c9'}`}>
                        <Info bgcolor={`${value !== '' ? '#059669' : '#c9c9c9'}!important`} />
                        {getTranslation(error.message)}
                    </Wrapper>
                ) : error.name === 'min' ? (
                    <Wrapper
                        flexBox
                        alignItems='center'
                        color={`${
                            value.length === 0 ? '#c9c9c9' : value.length >= error.params.min ? '#059669' : '#ef4444'
                        }`}
                    >
                        <Info
                            bgcolor={`${
                                value.length === 0
                                    ? '#c9c9c9'
                                    : value.length >= error.params.min
                                    ? '#059669'
                                    : '#ef4444'
                            }!important`}
                        />
                        {getTranslation(error.message)}
                    </Wrapper>
                ) : error.name === 'max' ? (
                    <Wrapper
                        flexBox
                        alignItems='center'
                        color={`${
                            value.length === 0 ? '#c9c9c9' : value.length <= error.params.max ? '#059669' : '#ef4444'
                        }`}
                    >
                        <Info
                            bgcolor={`${
                                value.length === 0
                                    ? '#c9c9c9'
                                    : value.length <= error.params.max
                                    ? '#059669'
                                    : '#ef4444'
                            }!important`}
                        />
                        {getTranslation(error.message)}
                    </Wrapper>
                ) : error.name === 'matches' ? (
                    <Wrapper
                        flexBox
                        alignItems='center'
                        color={`${
                            value.length === 0
                                ? '#c9c9c9'
                                : value.match(error.params.regex) !== null
                                ? '#059669'
                                : '#ef4444'
                        }`}
                    >
                        <div>
                            <Info
                                bgcolor={`${
                                    value.length === 0
                                        ? '#c9c9c9'
                                        : value.match(error.params.regex) !== null
                                        ? '#059669'
                                        : '#ef4444'
                                }!important`}
                            />
                        </div>
                        {getTranslation(error.message)}
                    </Wrapper>
                ) : (
                    ''
                );
            })}
        </Wrapper>
    );
};

export default i18n(InfoErrorsPassword) as FC<InfoErrorsPasswordProps>;
