export interface PivotConfig {
    rows?: string[];
    cols?: string[];
    aggregatorName?: string;
    vals?: string[];
    rendererName?: string;
    valueFilter?: Record<string, Record<string, boolean>>;
    [key: string]: any;
}

export interface PivottableProps {
    data: any;
    filter: any;
    setFilter: (filter: any) => void;
    initialConfigState: PivotConfig | null;
    setInitialConfigState: (config: PivotConfig | null) => void;
    onChangeConfig: (configState: PivotConfig) => void;
}
