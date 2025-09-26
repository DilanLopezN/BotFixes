import { TrainingEntry } from '~/interfaces/training-entry';

export interface TrainingButtonProps {
  trainings: TrainingEntry[];
  setTrainings: React.Dispatch<React.SetStateAction<TrainingEntry[]>>;
}
