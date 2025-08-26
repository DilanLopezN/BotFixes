import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'AtLeastOneField', async: false })
export class AtLeastOneField implements ValidatorConstraintInterface {
    validate(_: any, args: ValidationArguments) {
        const obj = args.object as any;
        return obj.breakSettingId !== undefined || obj.changeToOffline !== undefined;
    }

    defaultMessage(args: ValidationArguments) {
        return 'Pelo menos um dos campos "breakSettingId" ou "changeToOffline" deve ser preenchido.';
    }
}
