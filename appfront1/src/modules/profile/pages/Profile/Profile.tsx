import { Component } from 'react';
import Page from '../../../../shared/Page';
import { addNotification } from '../../../../utils/AddNotification';
import { EditInformations } from '../../components/EditInformations';
import { ProfileProps } from './ProfileProps';

export class Profile extends Component<ProfileProps> {
    render() {
        return (
            <Page>
                <EditInformations addNotification={(params) => addNotification(params)} />
            </Page>
        );
    }
}

export default Profile;
