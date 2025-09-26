import { FC } from 'react'
import { Wrapper, Card } from '../../../../ui-kissbot-v2/common'

const ChartWrapper:FC<ChartWrapperProps> = (props) => (
  <Wrapper
    width={props.width} 
    height={props.heigth}
    style={{'flex': props.flex || '1'}}
  >
    <Wrapper margin="20px 20px 20px 0px">
      <Card padding="20px">
        { !!props.children && props.children }
      </Card>
    </Wrapper>
  </Wrapper>
)

interface ChartWrapperProps {
  width?: string;
  heigth?: string;
  flex?: string;
  children?: React.ReactNode;
}

export default ChartWrapper
