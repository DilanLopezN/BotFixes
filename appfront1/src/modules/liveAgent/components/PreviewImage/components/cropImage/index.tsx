import React, { FC, useState, useEffect, useCallback, useRef } from 'react';
import { CropImageProps } from './props';
import Cropper from 'react-easy-crop';
import { getCroppedImage, getRotatedImage } from './crop.service';
import { timeout } from '../../../../../../utils/Timer';

const CropImage: FC<CropImageProps> = (props) => {
    const { src, rotation, extension, name, cropping, setZoom, zoom, setCrop, crop } = props;

    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const croppedAreaPixelsRef: any = useRef(null);
    croppedAreaPixelsRef.current = { croppedAreaPixels };

    const propsRef: any = useRef(null);
    propsRef.current = { src, rotation, extension, name };

    const zoomLimit = 5;
    const aspect = 4 / 3;

    useEffect(() => {
        setZoom(1);
        setCroppedAreaPixels(null);
        setCrop({ x: 0, y: 0 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src]);

    const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    useEffect(() => {
        window.addEventListener('@crop_requested', handler_crop_request);
        window.addEventListener('@image_request', handler_image_request);

        return () => {
            window.removeEventListener('@crop_requested', handler_crop_request);
            window.removeEventListener('@image_request', handler_image_request);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handler_image_request = useCallback(async (ev) => {
        const croppedImage: any = await getRotatedImage(propsRef.current.src, propsRef.current.rotation);

        window.dispatchEvent(
            new CustomEvent('@image_data_done', {
                detail: {
                    type: 'success',
                    data: {
                        croppedImage,
                        src: propsRef.current.src,
                        id: ev?.detail.id,
                        file: {
                            extension: propsRef.current.extension,
                            name: propsRef.current.name,
                        },
                    },
                },
            })
        );
    }, []);

    const handler_crop_request = useCallback(
        async (ev: any) => {
            try {
                const croppedImage: any = await getCroppedImage(
                    propsRef.current.src,
                    croppedAreaPixelsRef.current.croppedAreaPixels,
                    propsRef.current.rotation
                );

                window.dispatchEvent(
                    new CustomEvent('@crop_done', {
                        detail: {
                            type: 'success',
                            data: {
                                croppedImage,
                                src: propsRef.current.src,
                                id: ev?.detail.id,
                                file: {
                                    extension: propsRef.current.extension,
                                    name: propsRef.current.name,
                                },
                            },
                        },
                    })
                );
            } catch (e) {
                window.dispatchEvent(
                    new CustomEvent('@crop_done', {
                        detail: {
                            type: 'error',
                            data: { src: propsRef.current.src, id: ev.detail.id },
                        },
                    })
                );
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [croppedAreaPixels, rotation, src]
    );

    return !cropping ? (
        <Cropper
            key={src}
            showGrid={false}
            image={src}
            crop={crop}
            rotation={rotation}
            zoom={zoom}
            maxZoom={zoomLimit}
            onCropChange={(newCrop) => {
                timeout(() => {
                    setCrop(newCrop);
                }, 20);
            }}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            style={{
                cropAreaStyle: {
                    border: 0,
                    boxShadow: 'none',
                },
                mediaStyle: {
                    willChange: 'auto',
                },
            }}
        />
    ) : (
        <>
            <Cropper
                key={src}
                showGrid={false}
                image={src}
                aspect={aspect}
                crop={crop}
                rotation={rotation}
                zoom={zoom}
                style={{
                    mediaStyle: {
                        willChange: 'auto',
                    },
                }}
                maxZoom={zoomLimit}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
            />
        </>
    );
};

export default CropImage;
