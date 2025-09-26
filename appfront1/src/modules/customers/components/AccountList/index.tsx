import { Table } from 'antd';
import Search from 'antd/lib/input/Search';
import { ColumnProps } from 'antd/lib/table';
import { useEffect } from 'react';
import { useState } from 'react';
import { FC } from 'react'
import styled from 'styled-components';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import i18n from '../../../i18n/components/i18n'
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { CustomersService } from '../../service/BillingService';
import { AccountListProps } from './props';

const Redirect = styled(Wrapper)`
    cursor: pointer;

    :hover{
        text-decoration: underline;
        color: #255fff;
    }
`

const AccountList: FC<AccountListProps & I18nProps> = ({
    getTranslation,
    selectCustomer
}) => {
    const [dataSource, setDataSource] = useState<any>([]);
    const [searchDataSource, setSearchDataSource] = useState<any>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        getAccounts()

    }, [])

    useEffect(() => {
        searchResult()

    }, [search])

    const getAccounts = async () => {
        const response = await CustomersService.getAccounts(false)

        if (!response) return;

        data(response)
    }

    const columns: ColumnProps<any>[] = [
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Name')}</Wrapper>,
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.name.localeCompare(b.name.name),
            sortDirections: ['descend', 'ascend'],
            defaultSortOrder: 'ascend',
            render: obj => {
                return <Redirect onClick={() => selectCustomer(obj.account)}>{obj.name}</Redirect>
            }
        },
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Linked workspaces')}</Wrapper>,
            dataIndex: 'workspaces',
            key: 'workspaces',
            render: workspaces => {
                return <Wrapper flexBox>{workspaces.map((name, index) => {
                    return <Wrapper margin='0 5px 0 0'>{`${name}${index !== workspaces.length - 1 ? ',' : ''}`}</Wrapper>
                })}
                </Wrapper>
            }
        },
    ];

    const data = (accounts) => {
        const data = accounts.map((account, index) => {
            const vinculeToWorkspaceIds = account.vinculeToWorkspaceIds.map(w => w.id)
            const workspaces = account.vinculeToWorkspaceIds.map(w => w.name)

            return {
                key: index,
                name: {
                    name: account.company,
                    account: { ...account, vinculeToWorkspaceIds: vinculeToWorkspaceIds },
                },
                workspaces: workspaces
            }
        })

        setSearchDataSource(data)
        return setDataSource(data);
    }

    const searchResult = () => {
        if(search === ''){
            return setSearchDataSource(dataSource)
        }

        const newDataSource: any = []
        dataSource.filter((e) => { 
            const searchName =  e.name.name.toLowerCase().includes(search.toLocaleLowerCase());
            
            if(searchName) {
                newDataSource.push(e)
            }else {
                const searchWorkspace = e.workspaces.find(el => el.toLowerCase().includes(search.toLocaleLowerCase()))
                if(searchWorkspace){
                    newDataSource.push(e)
                }
            }
        });
        
        if (newDataSource.length) {
            return setSearchDataSource(newDataSource);
        } else {
            setSearchDataSource([]);
        }
    }

    return <>
        <Wrapper
            width='70%'
            minWidth='800px'
            margin='0 auto'
            flexBox
            flexDirection='column'
        >
        <Wrapper 
            flexBox
            justifyContent='flex-end'
            margin='0 0 20px'
        >
            <Search
                autoFocus
                style={{
                    height: '38px',
                    width: '400px'
                }}
                placeholder={'Search'}
                onChange={(ev: any) => setSearch(ev.target.value)}
                allowClear
            />
        </Wrapper>
            <Table
                style={{
                    background: '#fff',
                    border: '1px solid #e8e8e8',
                    borderBottom: 'none',
                    borderRadius: '3px',
                    width: '100%'
                }}
                showSorterTooltip={false}
                columns={columns}
                dataSource={searchDataSource}
                pagination={false}
            />
        </Wrapper>
    </>
}

export default i18n(AccountList)
