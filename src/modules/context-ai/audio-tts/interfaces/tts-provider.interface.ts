export interface TTSOptions {
    voice?: string;
    model?: string;
    speed?: number;
    format?: string;
}

export interface TTSResponse {
    audioBuffer: Buffer;
    format: string;
    size: number;
    cost: number;
    durationSeconds: number;
    processingTimeMs: number;
}

export interface ITTSProvider {
    convertTextToAudio(text: string, options?: TTSOptions): Promise<TTSResponse>;
    getSupportedVoices(): string[];
    getSupportedModels(): string[];
    calculateCost(text: string, options?: TTSOptions): number;
}