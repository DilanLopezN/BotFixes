import { User } from '../../interfaces/user'

export default interface UserAvatarProps {
    user: User | any;
    size?: any;
    hashColor?: string;
    margin?: string;
    style?: any;
    id?: string;
}
