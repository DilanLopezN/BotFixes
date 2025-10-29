interface Crop {
    x: number;
    y: number;
}
export interface CropImageProps {
    src: string;
    rotation: number;
    onCancel: () => void;
    name: string;
    extension: string;
    cropping: boolean;
    crop: Crop;
    setCrop: React.Dispatch<React.SetStateAction<Crop>>;
    zoom: number;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
}
