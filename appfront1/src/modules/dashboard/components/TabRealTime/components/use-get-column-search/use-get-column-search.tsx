import { Button, Checkbox, Divider } from 'antd';
import { CheckboxValueType } from 'antd/es/checkbox/Group';
import { ColumnType } from 'antd/lib/table';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { useLanguageContext } from '../../../../../i18n/context';
import { ResultAnalytics } from '../../props';
import '../../style.scss';
import { ColumnSearchProps } from './interfaces';

const BoxFilters = styled.div`
    display: flex;
    flex-direction: column;
    cursor: pointer;
    padding-right: 8px;
`;

const OptionFilter = styled.span`
    padding-left: 8px;
    :hover {
        background: #f7f7fa;
    }
`;

const WrapperCheckBox = styled.div`
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    max-height: 150px;
    margin-bottom: 8px;
`;

const DividerStyle = styled(Divider)`
    margin: 8px 0 !important;
    width: max-content;
    font-size: 13px !important;
    font-weight: bold !important;
`;

export const useGetColumnSearchProps = <T extends ResultAnalytics>({
    dataFilter = [],
    selectedKeysData = [],
    setSelectedKeysData,
    data,
    showOnlyWith,
}: ColumnSearchProps<T>): ColumnType<T> => {
    const { getTranslation } = useLanguageContext();
    const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

    const handleCheckboxChange = (checkedValues: Array<CheckboxValueType>) => {
        setSelectedKeys(checkedValues as string[]);
    };

    useEffect(() => {
        setSelectedKeys(selectedKeysData);
    }, [selectedKeysData]);

    return {
        filterDropdown: ({ confirm, clearFilters, visible }) => {
            return (
                <div style={{ padding: 8 }}>
                    <DividerStyle orientation={'left'}>{`${getTranslation('Filtros')}`}</DividerStyle>
                    <BoxFilters>
                        <OptionFilter
                            onClick={() => {
                                const newValueSelected = dataFilter.map((data) => data._id || data.key);

                                setSelectedKeys(newValueSelected);
                            }}
                        >
                            {getTranslation('Check all')}
                        </OptionFilter>
                        <OptionFilter
                            onClick={() => {
                                if (!data) {
                                    return;
                                }
                                const newValueSelected = data
                                    .filter((item) => !selectedKeys.some((el) => el === item.key))
                                    ?.map((el) => el.key);
                                setSelectedKeys(newValueSelected);
                            }}
                        >
                            {getTranslation('invert selection')}
                        </OptionFilter>
                        {showOnlyWith && (
                            <OptionFilter
                                onClick={() => {
                                    if (!data) {
                                        return;
                                    }
                                    const newValueSelected = data
                                        .filter((item) => !!item?.countForService || !!item?.countInAttendance)
                                        ?.map((el) => el.key);
                                    setSelectedKeys(newValueSelected);
                                }}
                            >
                                {getTranslation('Show only with calls')}
                            </OptionFilter>
                        )}
                    </BoxFilters>
                    <DividerStyle orientation={'left'}>{`${getTranslation('show selected')}`}</DividerStyle>
                    <WrapperCheckBox>
                        <Checkbox.Group
                            defaultValue={selectedKeysData}
                            value={selectedKeys}
                            onChange={handleCheckboxChange}
                        >
                            {dataFilter.map((item) => {
                                const itemId = item._id || item.key;
                                const itemName = item?.name || item?.user;
                                return (
                                    <Checkbox
                                        style={{ margin: 1, display: 'flex', alignItems: 'baseline' }}
                                        value={itemId}
                                    >
                                        <div
                                            style={{
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                width: '200px',
                                            }}
                                            title={itemName}
                                        >
                                            {itemName}
                                        </div>
                                    </Checkbox>
                                );
                            })}
                        </Checkbox.Group>
                    </WrapperCheckBox>
                    <Wrapper flexBox justifyContent='space-between'>
                        <Button
                            className='ant-btn-primary-color'
                            onClick={() => {
                                clearFilters?.();
                                setSelectedKeys([]);
                            }}
                            size='small'
                            type='link'
                        >
                            {getTranslation('Clear')}
                        </Button>
                        <Button
                            className='ant-btn-primary-color'
                            type='primary'
                            onClick={() => {
                                setSelectedKeysData(selectedKeys);
                                confirm();
                            }}
                            size='small'
                        >
                            {getTranslation('Ok')}
                        </Button>
                    </Wrapper>
                </div>
            );
        },
    };
};
