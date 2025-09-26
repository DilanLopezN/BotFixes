import React, { FC } from "react";
import { BotConfigViewProps } from "./props";
import { Wrapper } from "../../../../ui-kissbot-v2/common";

const BotConfigView: FC<BotConfigViewProps> = (props) => {
  const {
    menuSelected,
    addNotification,
    referencePage
  } = props;

  const Component = menuSelected.component;

  return (
    <Wrapper
      flexBox
      flexDirection='column'
      alignItems='center'
      height='100%'
    >
      <Wrapper
        flex
        width='100%'>
        <Component
          referencePage={referencePage}
          addNotification={addNotification}
          menuSelected={menuSelected} />
      </Wrapper>
    </Wrapper>
  )
}

export default BotConfigView;