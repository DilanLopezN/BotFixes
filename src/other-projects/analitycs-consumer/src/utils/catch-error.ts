import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException, HttpStatus, HttpException } from "@nestjs/common";

export class CustomBadRequestException extends BadRequestException {}
export class CustomNotFoundRequestException extends NotFoundException {}
export class CustomUnauthorizedException extends UnauthorizedException {}
export class CustomForbiddenException extends ForbiddenException {}

const INTERNAL_ERROR_THROWER = (location: string, err: unknown): void => {
    if (err instanceof CustomBadRequestException || err instanceof CustomNotFoundRequestException) {
        throw err;
        // throw {
        //     ...err,
        //     location,
        // };
    }

    // if (process.env.NODE_ENV != 'test') {
    console.error(`ERROR: ${location}`, err);
    // }
    throw INTERNAL_ERROR(location, err);
};


const INTERNAL_ERROR = (location: string, _: unknown) =>
    new HttpException(
        {
            // message: err,
            location: location,
            token: 'INTERNAL_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
    );

export function CatchError() {
    return function (_: any, propertyKey: string, descriptor: PropertyDescriptor): void {
        const method = descriptor.value;
        descriptor.value = async function (...args: any) {
            try {
                return await method.apply(this, args);
            } catch (e) {
                const errorPlace = `${this.constructor?.name}.${propertyKey}`;
                INTERNAL_ERROR_THROWER(errorPlace, e);
            }
        };
    };
}
