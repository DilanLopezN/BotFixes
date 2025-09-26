import React, { useState, useEffect, FC } from 'react';
import { MicIcon, FinishIcon, CancelIcon } from './styled';
import I18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { AudioRecorderProps } from './props';
import { TimeCounter } from './components/TimeCounter';
import OpusMediaRecorder from 'opus-media-recorder';
import { v4 } from 'uuid';

const workerOptions = {
    encoderWorkerFactory: () => new Worker('assets/opus_media_recorder/encoderWorker.umd.js'),
    OggOpusEncoderWasmPath: '/assets/opus_media_recorder/OggOpusEncoder.wasm',
    WebMOpusEncoderWasmPath: '/assets/opus_media_recorder/WebMOpusEncoder.wasm',
};

let recorder;
const options = { mimeType: 'audio/ogg; codecs=opus' };

const AudioRecorder = ({ onRecord, getTranslation, disabled }: AudioRecorderProps & I18nProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPermissionDenied, setIsPermissionDenied] = useState(false);
    const hasRecordingSupport = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  
    const checkPermissionStatus = async () => {
        try {
            const permissionName: any = 'microphone';
            const status = await (navigator.permissions.query as any)({ name: permissionName });

            if (status.state === 'denied') {
                setIsPermissionDenied(true);
            }
        } catch (e) {}
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            recorder = new OpusMediaRecorder(stream, options, workerOptions);
            recorder.start();

            setIsRecording(true);
        } catch (e) {
            checkPermissionStatus();
        }
    };

    const stopRecording = (canceled: boolean) => {
        if (!recorder) return;

        recorder.addEventListener('dataavailable', ({ data }) => {
            if (!canceled) {
                const fullBlob = new Blob([data], { type: options.mimeType });
                const file = new File([fullBlob], `audio-${v4()}.ogg`, {
                    type: fullBlob.type,
                    lastModified: Date.now(),
                });

                onRecord(file);
            }
        });

        recorder.stream.getTracks().forEach((track) => track.stop());
        recorder.stop();
        recorder = null;

        setIsRecording(false);
    };

    useEffect(() => {
        checkPermissionStatus();

        return () => stopRecording(true);
    }, []);

    if (!isRecording) {
        return (
            <MicIcon
                title={getTranslation('Record')}
                onClick={() => {
                    if (disabled) {
                        return;
                    }
                    if (!hasRecordingSupport) {
                        alert(getTranslation('Your browser do not support audio recording'));
                        return;
                    }

                    if (isPermissionDenied) {
                        alert(getTranslation('This app need your permission to audio record'));

                        checkPermissionStatus();
                        return;
                    }

                    startRecording();
                }}
            />
        );
    }

    return (
        <div>
            <CancelIcon title={getTranslation('Cancel')} onClick={() => stopRecording(true)} />
            <TimeCounter />
            <FinishIcon title={getTranslation('Finish')} onClick={() => stopRecording(false)} />
        </div>
    );
};

export default I18n(AudioRecorder) as FC<AudioRecorderProps>;
