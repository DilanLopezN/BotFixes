import { FC } from 'react';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { isAnySystemAdmin, isWorkspaceAdmin } from '../../../../../../utils/UserPermission';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import TagSelector from '../../../TagSelector';
import { Tag } from '../../../TagSelector/props';
import CardWrapper from '../CardWrapper';
import { CustomBadge, Label } from '../Common/common';
import { TagListProps } from './props';

const List = ({ tags, loggedUser }) => {
    const isAnyAdmin = isAnySystemAdmin(loggedUser);

    const listTags = tags.filter((tag) => {
        return isAnyAdmin ? tag : !tag.name.includes('@sys') && tag;
    });
    return (
        <div
            style={{
                display: 'inline-flex',
                flexWrap: 'wrap',
                width: '100%',
            }}
        >
            {listTags.map((tag: Tag) => (
                <CustomBadge style={{ width: '100%', maxWidth: 'max-content' }} key={tag._id} tag={tag} />
            ))}
        </div>
    );
};

const TagList: FC<TagListProps & I18nProps> = ({
    readingMode,
    conversation,
    workspaceId,
    onTagsChanged,
    loggedUser,
    getTranslation,
}) => {
    const canAccess = isAnySystemAdmin(loggedUser) || isWorkspaceAdmin(loggedUser, workspaceId);

    return (
        <CardWrapper>
            {!readingMode && (
                <Wrapper padding='4px 0' flexBox alignItems='center' fontSize='13px'>
                    <TagSelector
                        conversation={conversation}
                        workspaceId={workspaceId}
                        onTagsChanged={onTagsChanged}
                        place='left'
                        loggedUser={loggedUser}
                    >
                        <Label title={getTranslation('Hang tags')}>{`${getTranslation('Hang tags')}:`}</Label>
                        {canAccess ? (
                            <span
                                title={getTranslation('add/remove tag')}
                                style={{
                                    cursor: 'pointer',
                                    margin: '0 5px',
                                    fontSize: '17px',
                                }}
                                className='mdi mdi-12px mdi-plus-circle-outline'
                            />
                        ) : (
                            conversation.assumed && (
                                <span
                                    title={getTranslation('add/remove tag')}
                                    style={{
                                        cursor: 'pointer',
                                        margin: '0 5px',
                                        fontSize: '17px',
                                    }}
                                    className='mdi mdi-12px mdi-plus-circle-outline'
                                />
                            )
                        )}
                    </TagSelector>
                </Wrapper>
            )}
            {!readingMode ? (
                conversation.tags?.length > 0 && (
                    <TagSelector
                        conversation={conversation}
                        workspaceId={workspaceId}
                        onTagsChanged={onTagsChanged}
                        place='left'
                        loggedUser={loggedUser}
                    >
                        <List tags={conversation.tags} loggedUser={loggedUser} />
                    </TagSelector>
                )
            ) : (
                <List tags={conversation.tags} loggedUser={loggedUser} />
            )}
        </CardWrapper>
    );
};

export default i18n(TagList) as FC<TagListProps>;
