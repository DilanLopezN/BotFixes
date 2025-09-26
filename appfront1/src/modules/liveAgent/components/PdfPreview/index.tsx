import React, { FC } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { PdfPreviewProps } from './props';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
                                                         //pdfjs-3.11.174-legacy-dist - https://github.com/mozilla/pdf.js/releases
pdfjs.GlobalWorkerOptions.workerSrc = '/assets/js/pdfWorker/pdf.worker.js';

const PdfPreview: FC<PdfPreviewProps> = ({ filePreview, onNumPages }) => {
    const removeTextLayerOffset = () => {
        const textLayers = document.querySelectorAll('.react-pdf__Page__textContent');
        textLayers.forEach((layer) => {
            const { style } = layer as any;
            style.top = '0';
            style.left = '0';
            style.transform = '';
            style.display = 'none';
        });
        const textLayersAnnotations = document.querySelectorAll('.react-pdf__Page__annotations.annotationLayer');
        textLayersAnnotations.forEach((layer) => {
            const { style } = layer as any;
            style.display = 'none';
        });
    };

    const onDocumentLoadSuccess = ({ numPages }) => {
        onNumPages(numPages);
    };

    return (
        <Wrapper
            style={{
                maxWidth: '100%',
                maxHeight: '60vh',
                margin: 'auto',
            }}
        >
            <Document file={filePreview.preview} onLoadSuccess={onDocumentLoadSuccess}>
                <Page pageNumber={1} onLoadSuccess={removeTextLayerOffset} />
            </Document>
        </Wrapper>
    );
};

export default PdfPreview;
