import React, { FC } from 'react'
import ReactJson from 'react-json-view'
import { JsonModalPreviewProps } from './props'

const JsonModalPreview: FC<JsonModalPreviewProps> = ({
    json,
}) => {
    return (
        <ReactJson
            style={{ fontSize: '0.93em' }}
            displayObjectSize={false}
            displayDataTypes={false}
            enableClipboard={false}
            theme='summerfruit:inverted' src={json} />
    )
}

export default JsonModalPreview
