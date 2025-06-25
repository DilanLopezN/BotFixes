import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FlowCategory } from '../models/flow-category.entity';
import { WHATSAPP_FLOW_CONNECTION } from '../ormconfig';
import { In, Repository } from 'typeorm';
import { CustomBadRequestException, INTERNAL_ERROR_THROWER } from '../../auth/exceptions';

@Injectable()
export class FlowCategoryService {
    private readonly logger = new Logger(FlowCategoryService.name);

    constructor(
        @InjectRepository(FlowCategory, WHATSAPP_FLOW_CONNECTION)
        private repository: Repository<FlowCategory>,
    ) {}

    async create(category: string) {
        const existingCategory = await this.repository.findOne({ where: { category } });

        if (existingCategory) {
            throw INTERNAL_ERROR_THROWER(
                'Categoria já existe',
                new CustomBadRequestException('Categoria já existe', 'CATEGORY_ALREADY_EXISTS'),
            );
        }

        return await this.repository.save({
            category: category,
        });
    }

    async createAllFlowCategory() {
        const categories = [
            'SIGN_UP',
            'SIGN_IN',
            'APPOINTMENT_BOOKING',
            'LEAD_GENERATION',
            'CONTACT_US',
            'CUSTOMER_SUPPORT',
            'SURVEY',
            'OTHER',
        ];

        const existingCategories = await this.repository
            .createQueryBuilder('flowCategory')
            .where('flowCategory.category IN (:...categories)', { categories })
            .getMany();

        const existingCategoryNames = existingCategories.map((cat) => cat.category);

        const newCategories = categories
            .filter((category) => !existingCategoryNames.includes(category))
            .map((category) => ({ category }));

        if (newCategories.length > 0) {
            await this.repository.save(newCategories);
        }
    }

    async getAll() {
        return await this.repository.find();
    }

    async getFlowCategoryByIds(ids: number[]) {
        return await this.repository.find({
            where: {
                id: In(ids),
            },
        });
    }

    async getFlowCategoryById(id: number) {
        return await this.repository.findOne(id);
    }
}
