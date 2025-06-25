
import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Account {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'address_line1'})
    addressLine1: string;

    @Column({name: 'address_line2'})
    addressLine2: string;

    @Column({nullable: true, name: 'address_line3'})
    addressLine3?: string;
    
    @Column()
    city: string;
    
    @Column()
    company: string;
    
    @Column({name: 'country_code'})
    countryCode: string;
    
    @Column({name: 'district_or_county'})
    districtOrCounty: string;
    
    @Column()
    ibge: string;
    
    @Column({name: 'phone_number'})
    phoneNumber: string;
    
    @Column({name: 'postal_code'})
    postalCode: string;
    
    @Column({nullable: true})
    email?: string;
    
    @Column()
    state: string;
    
    @Column({nullable: true})
    website?: string;
    
    @Column({name: 'tax_registration_type'})
    taxRegistrationType: string;
    
    @Column({name: 'registration_id'})
    registrationId: string;
    
    @Column({name: 'legal_name'})
    legalName: string;

    @Column({name: 'gateway_client_id', nullable: true})
    gatewayClientId: string;
}