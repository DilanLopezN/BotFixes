import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'TotalMaxDuration', async: false })
export class TotalMaxDurationConstraint implements ValidatorConstraintInterface {
    validate(_: any, args: ValidationArguments) {
        const obj = args.object as any;

        const total =
            (obj.notificationIntervalSeconds || 0) +
            (obj.breakStartDelaySeconds || 0) +
            (obj.maxInactiveDurationSeconds || 0);

        return total <= 28800;
    }

    defaultMessage(_: ValidationArguments) {
        return 'A soma de notificationIntervalSeconds, breakStartDelaySeconds e maxInactiveDurationSeconds não pode ultrapassar 28800 segundos';
    }
}
