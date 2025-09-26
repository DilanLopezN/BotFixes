import { Button } from 'antd';
import { orderBy } from 'lodash';
import { FC, useCallback, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { v4 } from 'uuid';
import { Bot } from '../../../../model/Bot';
import BlockUi from '../../../../shared-v2/BlockUi/BlockUi';
import Page from '../../../../shared/Page';
import Loader from '../../../../shared/loader';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { isSystemUxAdmin } from '../../../../utils/UserPermission';
import I18n from '../../../i18n/components/i18n';
import { BotCardItem } from '../../components/BotCardItem/BotCardItem';
import BotCreateButton from '../../components/BotCreateButton/BotCreateButton';
import { WorkspaceActions } from '../../redux/actions';
import './WorkspaceDetail.scss';
import { WorkspaceDetailProps } from './WorkspaceDetailProps';
import { useGetWorkspace } from './use-get-workspace';

const WorkspaceDetailFunc: FC<WorkspaceDetailProps> = (props) => {
    const { botList, setBotList, setSelectedWorkspace, match, history, workspaceList, loggedUser, getTranslation } =
        props;

    const [newBotName, setNewBotName] = useState<string | undefined>(undefined);
    const { workspace } = useGetWorkspace(props.workspaceList, match.params, history, setSelectedWorkspace);
    const isNewBotNameDefinedAndNotEmpty = newBotName !== undefined && newBotName !== '';

    const updatedBotList = useMemo(() => {
        return isNewBotNameDefinedAndNotEmpty ? botList.concat({ name: newBotName, cloning: true }) : botList;
    }, [botList, isNewBotNameDefinedAndNotEmpty, newBotName]);

    const onCreate = useCallback(() => {
        const params: any = match.params;
        setBotList(params.workspaceId);
    }, [match.params, setBotList]);

    const renderCreateButton = useCallback(() => {
        const params: any = match.params;
        if (isSystemUxAdmin(loggedUser as any)) {
            return (
                <BotCreateButton
                    setNameBotFromWorkspace={setNewBotName}
                    onCreate={onCreate}
                    workspaceId={params.workspaceId}
                    className=''
                />
            );
        }
        return null;
    }, [match.params, loggedUser, onCreate]);

    const sortedBotList = orderBy(updatedBotList, [(bot) => !bot.cloning], ['asc']);

    return (
        <Page className='WorkspaceList'>
            <Wrapper className='content'>
                {workspace ? (
                    <>
                        <BlockUi className='ModalInteraction'>
                            <div className='row'>
                                <div className='col-lg-12 button-add-bot'>
                                    <h4>Workspace - {workspace.name}</h4>

                                    <div className='container-options-workspace'>
                                        {workspaceList && workspaceList?.length > 1 && (
                                            <Link style={{ marginRight: '8px', minWidth: '70px' }} to={`/home/`}>
                                                <Button className='antd-span-default-color' type='default'>
                                                    {getTranslation('Back')}
                                                </Button>
                                            </Link>
                                        )}
                                        {renderCreateButton()}
                                    </div>
                                </div>
                            </div>
                            <div
                                className='row workspace-row my-4'
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '30px 150px',
                                }}
                            >
                                {botList?.length ? (
                                    sortedBotList.map((bot: Bot) => (
                                        <div key={v4()} style={{ width: '80%' }}>
                                            <BotCardItem bot={bot} />
                                        </div>
                                    ))
                                ) : (
                                    <Wrapper width='100%' flexBox justifyContent='center'>
                                        <Wrapper width='450px' padding='40px'>
                                            <Wrapper flexBox margin='30px 0 0 0' justifyContent='center'>
                                                <img
                                                    alt='empty'
                                                    style={{ height: '150px' }}
                                                    src='/assets/img/empty_draw.svg'
                                                />
                                            </Wrapper>
                                            <Wrapper flexBox textAlign='center' margin='30px 0'>
                                                {`${getTranslation("We didn't find any results, please try again")}.`}
                                            </Wrapper>
                                            <Wrapper flexBox justifyContent='center' margin='50px 20px'></Wrapper>
                                        </Wrapper>
                                    </Wrapper>
                                )}
                            </div>
                        </BlockUi>
                    </>
                ) : (
                    <Wrapper height='100%'>
                        <Loader />
                    </Wrapper>
                )}
            </Wrapper>
        </Page>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    botList: state.workspaceReducer.botList,
    loggedUser: state.loginReducer.loggedUser,
    workspaceList: state.workspaceReducer.workspaceList,
});

export const WorkspaceDetail = I18n(
    withRouter(
        connect(mapStateToProps, {
            setSelectedWorkspace: WorkspaceActions.setSelectedWorkspace,
            setBotList: WorkspaceActions.setBotList,
        })(WorkspaceDetailFunc)
    )
);
