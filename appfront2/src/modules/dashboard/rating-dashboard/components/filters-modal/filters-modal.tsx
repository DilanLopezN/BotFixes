import { Button, Col, Flex, Form, Modal, Row, Select, Space } from 'antd';
import type { ModalFooterRender } from 'antd/es/modal/interface';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryString } from '~/hooks/use-query-string';
import { localeKeys } from '~/i18n';
import { normalizeText } from '~/utils/normalize-text';
import { useTags } from '../../hooks/use-tags';
import { useTeamList } from '../../hooks/use-team-list';
import { useUserList } from '../../hooks/use-user-list';
import { FilterFormValues, FiltersModalProps } from './interfaces';

export const FiltersModal = ({ isVisible, onClose }: FiltersModalProps) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const filtersModalLocaleKeys = localeKeys.dashboard.ratingDashboard.components.filtersModal;

  const { userList, isLoadingUserList } = useUserList();
  const { teamList, isFetchingTeamList } = useTeamList();
  const { tags: tagList, isFetchingTags } = useTags();

  const ratingOptions = useMemo(
    () => [
      { value: '1', label: '1' },
      { value: '2', label: '2' },
      { value: '3', label: '3' },
      { value: '4', label: '4' },
      { value: '5', label: '5' },
    ],
    []
  );

  const feedbackOptions = useMemo(
    () => [
      { value: 'all', label: t(filtersModalLocaleKeys.feedbackOptionAll) },
      { value: 'withFeedback', label: t(filtersModalLocaleKeys.feedbackOptionWith) },
      { value: 'noFeedback', label: t(filtersModalLocaleKeys.feedbackOptionWithout) },
    ],
    [t, filtersModalLocaleKeys]
  );

  const { queryStringAsObj, updateQueryString } = useQueryString();

  const userOptions = useMemo(() => {
    return (
      userList?.map((user) => ({
        value: user._id,
        label: user.name,
      })) || []
    );
  }, [userList]);

  const teamOptions = useMemo(() => {
    return (
      teamList?.data.map((team) => ({
        value: team._id,
        label: team.name,
      })) || []
    );
  }, [teamList]);

  const tagOptions = useMemo(() => {
    return (
      tagList?.data.map((tag) => ({
        value: tag.name,
        label: tag.name,
      })) || []
    );
  }, [tagList?.data]);

  const handleApplyFilters = (values: FilterFormValues) => {
    const filtersToUpdate = {
      memberId: values.memberId || '',
      teamIds: values.teamIds?.join(',') || '',
      tags: values.tags?.join(',') || '',
      note: values.note || '',
      feedback: values.feedback || '',
    };
    updateQueryString(filtersToUpdate);
    onClose();
  };
  const handleResetFilters = () => {
    form.resetFields();
    const resetFilters = {
      memberId: '',
      teamIds: '',
      tags: '',
      note: '',
      feedback: '',
    };
    updateQueryString(resetFilters);
    onClose();
  };

  useEffect(() => {
    if (isVisible) {
      const { memberId, teamIds, tags, note, feedback } = queryStringAsObj;
      form.setFieldsValue({
        memberId,
        teamIds: teamIds?.split(','),
        tags: tags?.split(','),
        note,
        feedback,
      });
    }
  }, [isVisible, form, queryStringAsObj]);

  const renderModalFooter: ModalFooterRender = (_originNode, { OkBtn, CancelBtn }) => (
    <Flex justify='space-between'>
      <Button onClick={handleResetFilters}>{t(filtersModalLocaleKeys.buttonClean)}</Button>
      <Space>
        <CancelBtn />
        <OkBtn />
      </Space>
    </Flex>
  );

  return (
    <Modal
      forceRender
      title={t(filtersModalLocaleKeys.modalTitle)}
      open={isVisible}
      onCancel={onClose}
      okText={t(filtersModalLocaleKeys.okTextFilter)}
      cancelText={t(filtersModalLocaleKeys.cancelText)}
      okButtonProps={{
        htmlType: 'submit',
        form: 'rating-filter-form',
      }}
      footer={renderModalFooter}
    >
      <Form id='rating-filter-form' form={form} onFinish={handleApplyFilters} layout='vertical'>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name='memberId' label={t(filtersModalLocaleKeys.labelAgent)}>
              <Select
                allowClear
                loading={isLoadingUserList}
                options={userOptions}
                placeholder={t(filtersModalLocaleKeys.placeholderAgent)}
                showSearch
                filterOption={(search, option) =>
                  Boolean(normalizeText(option?.label).includes(normalizeText(search)))
                }
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name='teamIds' label={t(filtersModalLocaleKeys.labelTeams)}>
              <Select
                mode='multiple'
                allowClear
                loading={isFetchingTeamList}
                options={teamOptions}
                placeholder={t(filtersModalLocaleKeys.placeholderTeams)}
                showSearch
                filterOption={(search, option) =>
                  Boolean(normalizeText(option?.label).includes(normalizeText(search)))
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name='note' label={t(filtersModalLocaleKeys.labelRating)}>
              <Select
                allowClear
                options={ratingOptions}
                placeholder={t(filtersModalLocaleKeys.placeholderRating)}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name='feedback' label={t(filtersModalLocaleKeys.labelFeedback)}>
              <Select
                allowClear
                options={feedbackOptions}
                placeholder={t(filtersModalLocaleKeys.placeholderFeedback)}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name='tags' label={t(filtersModalLocaleKeys.labelTags)}>
              <Select
                mode='tags'
                allowClear
                loading={isFetchingTags}
                options={tagOptions}
                placeholder={t(filtersModalLocaleKeys.placeholderTags)}
                showSearch
                filterOption={(search, option) =>
                  Boolean(normalizeText(option?.label).includes(normalizeText(search)))
                }
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
