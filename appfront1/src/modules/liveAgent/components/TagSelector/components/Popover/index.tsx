import React, { FC } from 'react';
import { PopoverProps } from './props';
import Tags from '../Tags';
import Popover from 'react-popover';
import ClickOutside from 'react-click-outside';

const PopoverTags: FC<PopoverProps> = ({
  conversation,
  workspaceId,
  children,
  opened,
  onClose,
  onTagsChanged,
  workspaceTags,
  place,
  newListTags
}) => {

  return <Popover
    isOpen={opened}
    body={
      <ClickOutside onClickOutside={() => onClose()} >
        <Tags
          conversation={conversation}
          onTagsChanged={onTagsChanged}
          workspaceTags={workspaceTags}
          workspaceId={workspaceId}
          newListTags={newListTags}
        />
      </ClickOutside>
    }
    preferPlace={place || 'above'}
    children={children}
  />

}

export default
 PopoverTags;