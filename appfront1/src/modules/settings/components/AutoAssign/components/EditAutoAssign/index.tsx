import { Button, Checkbox, Divider, Empty, Form, Input, Pagination, Row, Select, Space, Table } from 'antd';
import { useFormik } from 'formik-latest';
import { OrganizationSettings } from 'kissbot-core';
import { FC, useEffect, useState } from 'react';
import { AiOutlineClose } from 'react-icons/ai';
import PhoneInput from 'react-phone-input-2';
import { useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import styled from 'styled-components';
import * as Yup from 'yup';
import { ChannelConfig } from '../../../../../../model/Bot';
import { Team } from '../../../../../../model/Team';
import CardWrapperForm from '../../../../../../shared-v2/CardWrapperForm/CardWrapperForm';
import Header from '../../../../../../shared-v2/Header/Header';
import HelpCenterLink from '../../../../../../shared/HelpCenterLink';
import { ModalConfirm } from '../../../../../../shared/ModalConfirm/ModalConfirm';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { addNotification } from '../../../../../../utils/AddNotification';
import { searchResult } from '../../../../../../utils/SearchResult';
import { validatePhoneNumber } from '../../../../../../utils/validatePhoneNumber';
import I18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { ChannelConfigService } from '../../../../../newChannelConfig/service/ChannelConfigService';
import { ApiError } from '../../../../../../interfaces/api-error.interface';
import {
    AutoAssignConversation,
    ContactAutoAssign,
    UpdateAutoAssignConversation,
} from '../../../../interfaces/auto-assign-conversation.interface';
import { AutoAssignService } from '../../../../service/AutoAssignService';
import { SettingsService } from '../../../../service/SettingsService';
import { ScrollView } from '../../../ScrollView';
import ImportContactsModal from '../ImportContactsModal';
import { EditAutoAssignProps } from './props';
import { BoxLabelsFlex, BoxLabelsGrid, CustomSection } from './styled';

const { Search } = Input;

const Title = styled.span`
    font-size: 16px;
    font-weight: 700;
`;

const EditAutoAssign: FC<EditAutoAssignProps & I18nProps> = (props) => {
    const { getTranslation, workspaceId } = props;
    const settings: OrganizationSettings = useSelector((state: any) => state.loginReducer.settings);
    const params: any = useParams();
    const getValidationSchema = (): Yup.ObjectSchema => {
        return Yup.object().shape({
            name: Yup.string()
                .required(getTranslation('Name is required'))
                .min(3, getTranslation('Character min length is 3'))
                .max(255, getTranslation('Character max length is 255')),
            teamId: Yup.string().required(getTranslation('Team is required')),
            channelConfigIds: Yup.array().min(1, getTranslation('Channel is required')).of(Yup.string().required()),
            contacts: Yup.array().of(
                Yup.object().shape({
                    name: Yup.string().required('This field is required'),
                    phone: Yup.string().required('This field is required').min(12),
                    workspaceId: Yup.string().required(),
                })
            ),
        });
    };
    const getInitialValues = (): AutoAssignConversation => ({
        enableRating: false,
        name: '',
        teamId: '',
        channelConfigIds: [] as string[],
        workspaceId: workspaceId,
        contacts: [{ name: '', phone: '55', workspaceId }],
    });
    const history = useHistory();
    const [automaticallyAssign, setAutomaticallyAssign] = useState<AutoAssignConversation>(getInitialValues);
    const [currentPage, setPage] = useState(1);
    const [validPhoneNumber, setValidPhoneNumber] = useState<boolean>(false);
    const [phonePersonalized, setPhonePersonalized] = useState<boolean>(false);
    const [deleteAutoAssigne, setDeleteAutoAssigne] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [repeatedNumbers, setRepeatedNumbers] = useState<string[]>([]);
    const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [teams, setTeams] = useState<Team[]>([]);
    const [channels, setChannels] = useState<ChannelConfig[]>([]);

    const form = useFormik({
        initialValues: automaticallyAssign,
        enableReinitialize: true,
        validationSchema: getValidationSchema(),
        onSubmit: (values) => saveAutoAssign(values),
    });
    const [pageOffset] = useState(0);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const pageSize = 10;
    const totalContacts = form.values.contacts.length;
    const startIndex = (currentPage - 1) * pageSize;
    const locale = {
        emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={getTranslation('No Data')} />,
    };
    let isNonRepeated = false;

    // const totalPages = Math.ceil(totalContacts / pageSize);
    useEffect(() => {
        // runGlobalEvents();
        onSearchResult();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, form.values.contacts]);

    // const onBeforeUnload = (event) => {
    //     event.preventDefault();
    //     event.returnValue = '';
    //     return;
    // };

    // const runGlobalEvents = () => {
    //     const hasUnsavedChanges = form.values.contacts.slice(1).some((contact) => {
    //         console.log(contact);
    //         return !contact.id;
    //     });

    //     if (hasUnsavedChanges) {
    //         window.addEventListener('beforeunload', onBeforeUnload);
    //     }
    // };como-utilizar-a-funcionalidade-de-atribuir-automaticamente

    const onSearchResult = () => {
        if (search === '') {
            return setSearchResults(form.values.contacts);
        } else {
            const results = searchResult(search, form.values.contacts, ['name', 'phone']);
            return setSearchResults(results);
        }
    };

    const columns = [
        {
            width: '2%',
            key: 'actions',
            render: (_, r, index) => (
                <Space size='middle'>
                    <Checkbox
                        style={{ marginTop: '1.5rem' }}
                        onChange={(e) => {
                            const isChecked = e.target.checked;
                            const contactId = startIndex + index;
                            if (isChecked) {
                                setSelectedContacts((prevContacts) => [...prevContacts, contactId]);
                            } else {
                                setSelectedContacts((prevContacts) => prevContacts.filter((c) => c !== contactId));
                            }
                        }}
                        checked={selectedContacts.includes(startIndex + index)}
                    />
                </Space>
            ),
        },
        {
            dataIndex: 'name',
            width: '50%',
            key: 'name',
            render: (_, record, index) => (
                <>
                    <span>{getTranslation('Name')}</span>
                    <Input
                        style={{ borderColor: !record.name ? '#d79f9f' : undefined }}
                        id={`inputContactName-${index}`}
                        value={record.name}
                        onChange={(e) => {
                            handleChangeContact('name', e.target.value, pageOffset + index);
                        }}
                    />
                </>
            ),
        },
        {
            dataIndex: 'phone',
            width: '30%',
            key: 'phone',
            render: (text, record, index) => (
                <>
                    <span>{getTranslation('Phone')}</span>
                    <PhoneInput
                        onKeyDown={(event) => {
                            if (event.key === 'Tab' && text.length >= 12 && index === 0) {
                                handleAddContact();
                            }
                        }}
                        dropdownClass={
                            searchResults.length <= 3 ||
                            index == searchResults.length - 1 ||
                            (searchResults.length > 3 && index == searchResults.length - 2)
                                ? 'input-phone-dropdown'
                                : undefined
                        }
                        enableSearch
                        inputClass='input-phone-number'
                        value={record.phone}
                        masks={{
                            br: ['(..) ..... ....'],
                            ar: ['. ... ... ....'],
                            py: ['(...) ... ...'],
                        }}
                        prefix={phonePersonalized ? '' : '+'}
                        countryCodeEditable={false}
                        inputStyle={{ width: '100%', height: '32px' }}
                        enableTerritories
                        country={'br'}
                        isValid={(inputNumber, country: any, countries) => {
                            if (repeatedNumbers.find((invalidPhoneNumber) => invalidPhoneNumber === inputNumber)) {
                                return false;
                            }
                            const isValid = validatePhoneNumber({
                                countries,
                                country,
                                inputNumber,
                                phonePersonalized,
                                setPhonePersonalized,
                                setValidPhoneNumber,
                            });
                            return isValid;
                        }}
                        onChange={(phone) => {
                            handleChangeContact('phone', phone, pageOffset + index);
                        }}
                    />
                </>
            ),
        },
        {
            width: '5%',
            key: 'actions',
            render: (_, r, index) => (
                <Space size='middle'>
                    <AiOutlineClose
                        style={{ marginTop: '1.5rem' }}
                        title='Excluir'
                        cursor={'pointer'}
                        onClick={() => {
                            handleDelete(index);
                        }}
                    />
                </Space>
            ),
        },
    ];

    const handleChangeContact = (field: string, value: string, index: number) => {
        const contactIndex = startIndex + index;

        form.setFieldValue(
            'contacts',
            form.values.contacts.map((contact, i) => {
                if (i === contactIndex) {
                    return {
                        ...contact,
                        [field]: value,
                    };
                }

                return contact;
            })
        );
    };

    const handleAddContact = () => {
        const { values } = form;
        if (startIndex >= pageSize) {
            setPage(1);
        }
        const newContact: ContactAutoAssign = {
            workspaceId: workspaceId,
            name: '',
            phone: '55',
        };
        let contacts = values.contacts;
        contacts.unshift(newContact);

        form.setFieldValue('contacts', contacts);
        setTimeout(() => {
            const inputName = document.getElementById(`inputContactName-${0}`);
            if (inputName) {
                inputName.focus();
            }
        }, 300);
    };

    const handleDelete = (index: number) => {
        const adjustedIndex = startIndex + index;

        form.setFieldValue(
            'contacts',
            form.values.contacts.filter((_, idx) => idx !== adjustedIndex)
        );
    };

    const handleDeleteMultipleContacts = () => {
        form.setFieldValue(
            'contacts',
            form.values.contacts.filter((_, idx) => !selectedContacts.includes(startIndex + idx))
        );
        setSelectedContacts([]);
    };

    const getTeamOptions = () => {
        const options = (teams || []).map((team) => {
            return {
                label: (
                    <Wrapper title={team.name} truncate>
                        {team.name}
                    </Wrapper>
                ),
                value: team._id,
            };
        });

        return options;
    };

    const getChannelsOptions = () => {
        const options = (channels || []).map((channelConfig) => {
            return {
                label: (
                    <Wrapper title={channelConfig.name} truncate>
                        {channelConfig.name}
                    </Wrapper>
                ),
                value: channelConfig._id,
            };
        });

        return options;
    };

    const onDeleteAutoAssign = async () => {
        const { values } = form;

        if (!values.id || !workspaceId) {
            return;
        }
        let error: any;

        await AutoAssignService.deleteAutoAssign(workspaceId, values.id, (err: ApiError) => {
            error = err;
        });

        if (!error) {
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Successfully deleted'),
            });

            return onCancel();
        } else {
            addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error. Try again'),
                message: getTranslation('Error. Try again'),
            });
        }
    };

    const createAutoAssign = async (data) => {
        let error: any;
        setRepeatedNumbers([]);
        setIsSaving(true);

        const result = await AutoAssignService.createAutoAssign(workspaceId, data, (err: ApiError) => {
            error = err;
        });

        setTimeout(() => {
            setIsSaving(false);
        }, 300);

        if (result) {
            addNotification({
                type: 'success',
                title: getTranslation('Success'),
                message: getTranslation('Auto Assign created successfully'),
                duration: 3000,
            });

            return form.setValues({ ...form.values, id: result.id });
        } else if (error?.statusCode === 400) {
            addNotification({
                type: 'warning',
                title: getTranslation('Error'),
                message: getTranslation('Verify if the fields are correct'),
                duration: 3000,
            });
        } else if (error?.error === 'ERROR_CONTACT_AUTO_ASSIGN_CONVERSATION') {
            setRepeatedNumbers(error?.data);
            addNotification({
                type: 'warning',
                title: getTranslation('Warning'),
                message: getTranslation(
                    'Sorry, but the number you entered is already being used for automatic assignment.'
                ),
                duration: 3000,
            });
        } else {
            addNotification({
                type: 'danger',
                duration: 3000,
                title: getTranslation('Error'),
                message: getTranslation('Try again'),
            });
        }
    };

    const updateAutoAssign = async (autoAssign: UpdateAutoAssignConversation) => {
        let error: any;
        if (!autoAssign) {
            return;
        }

        setRepeatedNumbers([]);
        setIsSaving(true);
        const updatedGroup = await AutoAssignService.updateAutoAssignConversation(
            workspaceId,
            autoAssign,
            (err: ApiError) => {
                error = err;
            }
        );

        setTimeout(() => {
            setIsSaving(false);
        }, 300);

        if (!error && updatedGroup) {
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Auto Assign updated successfully'),
            });

            return;
        } else if (error?.error === 'ERROR_CONTACT_AUTO_ASSIGN_CONVERSATION') {
            setRepeatedNumbers(error?.data);
            addNotification({
                type: 'warning',
                title: getTranslation('Warning'),
                message: getTranslation(
                    'Sorry, but the number you entered is already being used for automatic assignment.'
                ),
                duration: 3000,
            });
        } else if (error?.statusCode === 400) {
            addNotification({
                type: 'danger',
                title: getTranslation('Error'),
                message: getTranslation('Verify if the fields are correct'),
                duration: 3000,
            });
        }
    };

    const saveAutoAssign = async (values: AutoAssignConversation) => {
        isNonRepeated = verifyNumber(values);
        if (isNonRepeated) {
            if (!values.id) {
                return createAutoAssign(values);
            }
            return updateAutoAssign(values as unknown as UpdateAutoAssignConversation);
        }
        return addNotification({
            type: 'warning',
            title: getTranslation('Warning'),
            message: getTranslation('The number is already present in the contact list'),
            duration: 3000,
        });
    };

    const verifyNumber = (values: AutoAssignConversation) => {
        const existingContacts = form.values.contacts;
        const allContacts = existingContacts.concat(values);

        const repeated = allContacts
            .map((contact) => contact.phone)
            .filter((phone, index, array) => array.indexOf(phone) !== index);

        setRepeatedNumbers(repeated);

        return repeated.length === 0;
    };

    const handlePageChange = (page) => {
        setPage(page);
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const modalImport = (
        <ImportContactsModal
            {...{
                isModalOpen,
                setIsModalOpen,
                form,
                getTranslation,
                workspaceId,
            }}
        />
    );

    const getTeams = async () => {
        const filter = {
            limit: 40,
        };

        const response = await SettingsService.getTeams(filter, workspaceId);
        return setTeams(response?.data);
    };

    const getChannelConfigs = async () => {
        const filter = {
            workspaceId: workspaceId,
            enable: true,
        };

        const data = await ChannelConfigService.getChannelsConfig(filter);
        return setChannels(data);
    };

    const getAutoAssignConversation = async (autoAssignConversationId: number) => {
        setLoading(true);
        const response = await AutoAssignService.getAutoAssignConversation(workspaceId, autoAssignConversationId);
        if (response) {
            setAutomaticallyAssign(response);
        }
        setTimeout(() => setLoading(false), 300);
    };

    useEffect(() => {
        const autoAssignConversationId = params?.autoAssignConversationId;
        if (autoAssignConversationId) {
            getAutoAssignConversation(Number(autoAssignConversationId));
        }
        if (!channels?.length) {
            getChannelConfigs();
            getTeams();
        }
    }, []);

    const onCancel = (): void => {
        history.push(`/settings/auto-assigns`);
    };

    return (
        <>
            <Header
                title={`${getTranslation('Adding contact list')}`}
                buttonBack={{ visible: true, onClick: onCancel }}
                buttonDelete={{
                    visible: !!automaticallyAssign,
                    onClick: (event: any) => {
                        event.stopPropagation();
                        setDeleteAutoAssigne(true);
                    },
                }}
                buttonSave={{ visible: true, onClick: () => form.submitForm(), loading: isSaving }}
            />
            {isModalOpen && modalImport}

            <ScrollView minWidth='900px'>
                <form>
                    <ModalConfirm
                        isOpened={deleteAutoAssigne}
                        onAction={(action: any) => {
                            if (action) {
                                onDeleteAutoAssign();
                            }
                            setDeleteAutoAssigne(false);
                        }}
                    >
                        <h5 style={{ textAlign: 'center' }}>{getTranslation('Confirm delete')}</h5>
                        <p style={{ margin: '10px 0px 17px' }}>
                            {getTranslation('Are you sure you want to delete the contact list?')}
                        </p>
                    </ModalConfirm>
                    <CardWrapperForm
                        loading={loading}
                        linkHelpCenter={
                            settings?.helpCenter?.articles?.[
                                'como-utilizar-a-funcionalidade-de-atribuir-automaticamente'
                            ]
                        }
                        textLinkHelpCenter={getTranslation('Understand more about auto assign')}
                        title={getTranslation('Auto assign setting')}
                        children={
                            <Form layout='vertical'>
                                <Space direction='vertical' size='middle' style={{ display: 'flex' }}>
                                    <Row justify='space-between' align='bottom'>
                                        <LabelWrapper
                                            validate={{
                                                errors: form.errors,
                                                fieldName: 'name',
                                                isSubmitted: true,
                                                touched: true,
                                            }}
                                            label={getTranslation('Name of list')}
                                        >
                                            <Input
                                                autoFocus
                                                key='name'
                                                name='name'
                                                type='text'
                                                onChange={(event) => {
                                                    form.setFieldValue('name', event.target.value);
                                                }}
                                                onBlur={form.handleBlur}
                                                value={form.values.name}
                                            />
                                        </LabelWrapper>
                                    </Row>
                                    <BoxLabelsGrid>
                                        <LabelWrapper
                                            validate={{
                                                errors: form.errors,
                                                fieldName: 'teamId',
                                                isSubmitted: true,
                                                touched: true,
                                            }}
                                            label={getTranslation('Team')}
                                        >
                                            <Select
                                                style={{ width: '100%' }}
                                                key='teamId'
                                                onChange={(value) => form.setFieldValue('teamId', value)}
                                                onBlur={form.handleBlur}
                                                value={form.values.teamId}
                                                options={getTeamOptions()}
                                            />
                                        </LabelWrapper>
                                        <LabelWrapper
                                            validate={{
                                                errors: form.errors,
                                                fieldName: 'channelConfigIds',
                                                isSubmitted: true,
                                                touched: true,
                                            }}
                                            label={getTranslation('Channel')}
                                        >
                                            <Select
                                                style={{ width: '100%' }}
                                                key='channelConfigIds'
                                                onChange={(value) => form.setFieldValue('channelConfigIds', value)}
                                                onBlur={form.handleBlur}
                                                value={form.values.channelConfigIds}
                                                mode='multiple'
                                                allowClear
                                                options={getChannelsOptions()}
                                            />
                                        </LabelWrapper>
                                    </BoxLabelsGrid>
                                    <Row>
                                        <Checkbox
                                            checked={form.values.enableRating}
                                            onChange={() => {
                                                form.setFieldValue('enableRating', !form.values.enableRating);
                                            }}
                                        >
                                            {getTranslation('Submit a review at the end of the call')}
                                        </Checkbox>
                                        <HelpCenterLink
                                            article={'69000869565-como-configurar-as-avaliacões-de-atendimentos-'}
                                        />
                                    </Row>
                                </Space>
                            </Form>
                        }
                    />

                    <Row style={{ padding: '0 24px' }} justify={'end'}>
                        <Search
                            className='search'
                            style={{
                                display: 'inline-block',
                                height: '38px',
                                width: '300px',
                            }}
                            placeholder={getTranslation('Search the list')}
                            onChange={(ev: any) => {
                                setSearch(ev.target.value);
                            }}
                            allowClear
                        />
                    </Row>

                    <CardWrapperForm
                        title={getTranslation('Contacts')}
                        childrenHeader={
                            <Row justify={'space-between'}>
                                <Title></Title>
                                <Row>
                                    <Button
                                        disabled={!selectedContacts.length}
                                        onClick={handleDeleteMultipleContacts}
                                        className='antd-span-default-color'
                                    >
                                        {getTranslation('Delete selected')}
                                    </Button>
                                    <Divider type='vertical' />
                                    <Button
                                        onClick={handleAddContact}
                                        className='ant-btn-primary antd-span-default-color'
                                    >
                                        {getTranslation('Add users')}
                                    </Button>
                                    <Divider type='vertical' />
                                    <Button
                                        onClick={handleOpenModal}
                                        className='ant-btn-primary antd-span-default-color'
                                    >
                                        {getTranslation('Import several')}
                                    </Button>
                                </Row>
                            </Row>
                        }
                        children={
                            <CustomSection style={{ boxShadow: 'none', margin: '5px 0 0 0', padding: '0 15px 5px 0' }}>
                                <Table
                                    showHeader={false}
                                    size='middle'
                                    columns={columns}
                                    dataSource={searchResults
                                        .slice(startIndex, startIndex + pageSize)
                                        .map((contact, index) => ({
                                            ...contact,
                                            key: index,
                                        }))}
                                    locale={locale}
                                    pagination={false}
                                />
                                <BoxLabelsFlex>
                                    <Pagination
                                        current={currentPage}
                                        total={totalContacts}
                                        pageSize={pageSize}
                                        onChange={handlePageChange}
                                        // hideOnSinglePage={totalPages === 1}
                                    />
                                </BoxLabelsFlex>
                            </CustomSection>
                        }
                    />
                </form>
            </ScrollView>
        </>
    );
};

export default I18n(EditAutoAssign) as FC<EditAutoAssignProps>;
