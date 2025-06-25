import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import * as aqp from 'api-query-params';

interface Aqp {
    filters: any[];
    limit?: number;
}

const checkLimit = (limit: number = 0, maxLimit: number) =>
    limit > maxLimit ? maxLimit : limit;

const checkField = (query: any, field: string) => !!query[field];

export const QueryStringDecorator = createParamDecorator(
    (defaultFields: Aqp, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        const aqpQuery = aqp(req.query);
        const query = req.query as any;

        if (
            typeof aqpQuery.filter?.['members.id'] !== 'string'
            && typeof query['members.id'] === 'string'
        ) {
            aqpQuery.filter['members.id'] = query['members.id'];
        }

        const params = req.params;

        const { limit, filter, projection } = query;

        if (checkField(query, 'limit'))
            aqpQuery.limit = checkLimit(parseInt(limit, 10), defaultFields.limit);

        const transform = () =>
            defaultFields.filters
                .map(field => ({
                    [Object.keys(field)[0]]: params[field[Object.keys(field)[0]]],
                }));
        
        const filterParams = {
            filter: {
                $and: [...transform()],
            },
        };
        
        if (query.filter) {
            filterParams.filter.$and.push(JSON.parse(filter));
        }

        if (query.projection) {
            aqpQuery.projection = JSON.parse(projection);
        }

        if (filterParams.filter.$and.length == 0) {
            delete filterParams.filter;
        }
        aqpQuery.filter = {
            ...aqpQuery.filter,
            ...filterParams.filter,
        };

        return aqpQuery;
    });
