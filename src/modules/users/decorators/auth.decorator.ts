import { SetMetadata } from '@nestjs/common';

const AuthPasswordExpiresDecorator = (validatePasswordExpires: boolean) =>
    SetMetadata('validatePasswordExpires', validatePasswordExpires);

export {
    AuthPasswordExpiresDecorator
}