import { FC, useState, useEffect } from 'react';
import { TagSelectorProps, Tag } from './props';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import PopoverTags from './components/Popover';
import { WorkspaceService } from '../../../workspace/services/WorkspaceService';
import { isAnySystemAdmin } from '../../../../utils/UserPermission';

const TagSelector: FC<TagSelectorProps> = ({ conversation, workspaceId, children, place, loggedUser }) => {
    const [modalOpened, setOpenModal] = useState<boolean>(false);
    const [loadedTags, setLoadedTags] = useState<boolean>(false);
    const [tags, setTags] = useState([] as Tag[]);
    const [disableReq, setDisableReq] = useState<boolean>(false)

    const onTagsChanged = (tag: Tag, remove: boolean, newTag?: boolean) => {
        if (newTag) setTags([...tags, tag]);
    };

    useEffect(() => {
        if (!modalOpened) return;

        if(!disableReq){
            getWorkspaceTags();
            setDisableReq(true);
        }
    }, [modalOpened]);

    const isAnyAdmin = isAnySystemAdmin(loggedUser);

    const newListTags = (tags) => {
        return tags.filter((tag) => {
            if (isAnyAdmin) {
                return true;
            }

            return !(tag.name.startsWith('@sys') || tag.name.startsWith('@bot')) || isAnyAdmin;
        });
    };

    const getWorkspaceTags = async () => {
        const response = await WorkspaceService.workspaceTags(workspaceId, {
            filter: {
                $or: [
                    {
                        inactive: false,
                    },
                    {
                        inactive: { $exists: false },
                    },
                ],
            },
        });

        const replacedTags = newListTags(response?.data ?? []);
        setTags(replacedTags ?? []);
        setLoadedTags(true);
    };

    const handleOpen = async () => {
        setOpenModal(true);
    };

    const handleClose = () => modalOpened && setOpenModal(false);

    return (
        <Wrapper onClick={handleOpen}>
            <PopoverTags
                conversation={conversation}
                workspaceId={workspaceId}
                onTagsChanged={onTagsChanged}
                workspaceTags={tags}
                onClose={handleClose}
                place={place}
                opened={modalOpened && loadedTags}
                newListTags={newListTags}
            >
                <Wrapper>{children}</Wrapper>
            </PopoverTags>
        </Wrapper>
    );
};

export default TagSelector;
