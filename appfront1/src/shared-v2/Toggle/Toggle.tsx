import { SwitchProps } from 'antd/lib/switch';
import { Switch } from 'antd';
import { FC } from 'react';
import styled from 'styled-components';

const Content = styled('div')`
    display: flex;
    align-items: center;
`

const Label = styled('div')`
    margin-left: 10px;
`

const Tooltip = styled('div')`
    .tooltip-container{
  position: relative;
  margin-left: 10px;
  .help-tooltip{
      position: absolute;
      bottom: 30px;
      padding: 5px;
      background: rgba(0,0,0,0.6);
      border-radius: 5px;
      display: none;
      .help-tooltip-content{
          position: relative;
          color: #FFFFFF;
          font-size: 12px;
          white-space: pre-wrap;
          width: max-content;
          &:before{
              content: " ";
              bottom: -10px;
              left: 10px;
              position: absolute;
              width: 0;
              height: 0;
              border-style: solid;
              border-width: 5px 5px 0 5px;
              border-color: rgba(0, 0, 0, 0.6) transparent transparent transparent;
          }
      }
  }
  &:hover{
   .help-tooltip{
       display: block;
   }
  }
}
`

interface EditTagProps extends SwitchProps {
    label?: string;
    tooltip?: string;
}

const EditTag: FC<EditTagProps> = ({
    ...props
}) => {


    return (
        <Content>
            <Switch
                {...props}
            />
            {
                props.label ?
                    <>
                        <Label>{props.label}</Label>
                        {
                            props.tooltip ?
                                <Tooltip>
                                    <span className="tooltip-container">
                                        <div className="help-tooltip" key={props.tooltip}>
                                            <div className="help-tooltip-content">
                                                {props.tooltip}
                                            </div>
                                        </div>
                                        <span className="mdi mdi-help-circle-outline mdi-18px" key={props.tooltip} />
                                    </span>
                                </Tooltip>
                                : null
                        }
                    </>
                    : null
            }
        </Content>
    );
};

export default EditTag as FC<EditTagProps>;
