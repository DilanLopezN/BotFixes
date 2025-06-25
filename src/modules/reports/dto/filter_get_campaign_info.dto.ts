import { Matches } from 'class-validator';

export class FilterCampaignInfoDto {
    // Valida se a data está no formato DD-MM-YYYY
    @Matches(/^\d{2}-\d{2}-\d{4}$/, {
        message: 'dataDaBusca deve estar no formato DD-MM-YYYY',
    })
    dataDaBusca: string;
}
