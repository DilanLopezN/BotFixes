import { FormikProps } from 'formik';
import { Team } from '../../../model/Team';

export interface EditTeamSectionProps extends FormikProps<Team> {
    workspaceId: string;
    team: Team;
    onChange: Function;
    setIsFormChanged:any;
}
