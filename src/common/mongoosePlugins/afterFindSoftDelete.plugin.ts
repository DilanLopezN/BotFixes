import { Schema } from 'mongoose';

export const AfterFindSoftDeletePlugin = (schema: Schema, options?) => {
    schema.add({ deletedAt: Date });

    schema.pre('findOne', function (next) {
        const that = this;
        that['deletedAt'] = null;
        next();
    });

    schema.pre('countDocuments', function (next) {
        const that = this;
        that['deletedAt'] = null;
        next();
    });

    schema.pre('find', function (next) {
        const that = this;
        that['deletedAt'] = null;
        next();
    });
};
