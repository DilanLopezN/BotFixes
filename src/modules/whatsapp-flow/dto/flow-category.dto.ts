import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class FlowCategoryDto {
    @ApiProperty({
        description: 'Tipo de categoria',
        enum: [
            'SIGN_UP',
            'SIGN_IN',
            'APPOINTMENT_BOOKING',
            'LEAD_GENERATION',
            'CONTACT_US',
            'CUSTOMER_SUPPORT',
            'SURVEY',
            'OTHER',
        ],
        example: 'SIGN_UP',
    })
    @IsIn([
        'SIGN_UP',
        'SIGN_IN',
        'APPOINTMENT_BOOKING',
        'LEAD_GENERATION',
        'CONTACT_US',
        'CUSTOMER_SUPPORT',
        'SURVEY',
        'OTHER',
    ])
    category: string;
}
