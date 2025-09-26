interface KissbotColor {
    default: string;
    contrast: string;
    light: string;
    dark: string
    type: ColorType;
    pastel?: string;
}

export enum ColorVariation {
    light = 'light',
    dark = 'dark',
    contrast = 'contrast',
    pastel = 'pastel',
}

export enum ColorType {
    primary = 'primary',
    secondary = 'secondary',
    success = 'success',
    alert = 'alert',
    danger = 'danger',
    text = 'text',
    white = 'white',
    laSelected = 'laSelected',
    light = 'light'
}

const colors: Array<KissbotColor> = [
    { default: '#007bff', pastel: '#e1f5fe', light: '#007bff', dark: '#007bff', contrast: '#f2f4f8', type: ColorType.primary },
    { default: '#6ea6c9', light: '#6ea6c9', dark: '#6ea6c9', contrast: '#d8e4ec', type: ColorType.secondary },
    { default: '#27ae60', pastel: '#dcf8c6', light: '#6FC482', dark: '#155724', contrast: '#33b371', type: ColorType.success },
    { default: '#faad14', pastel: '#ffce6e', light: '#f5c353', dark: '#ea9c00', contrast: '#bb7c00', type: ColorType.alert },
    { default: '#dc3545', light: '#dc3545', dark: '#dc3545', contrast: '#ffffff', type: ColorType.danger },
    { default: '#555555', light: '#777777', dark: '#444444', contrast: '#f2f4f8', type: ColorType.text },
    { default: '#FFFFFF', light: '#FF000000', dark: '#C0C0C0', contrast: '#696969', type: ColorType.white },
    { default: '#dcdcdc80', light: '#dcdcdc80', dark: '#dcdcdc80', contrast: '#dcdcdc80', type: ColorType.laSelected },
    { default: '#FF000000', light: '#FF000000', dark: '#FF000000', contrast: '#FF000000', type: ColorType.light },
]

export const getColor = (colorType?: ColorType, variation?: ColorVariation): string => {
    const color: KissbotColor = (colors.find(color => color.type == (colorType || ColorType.primary)) as KissbotColor);
    return color[variation || 'default'] || color.default;
}

