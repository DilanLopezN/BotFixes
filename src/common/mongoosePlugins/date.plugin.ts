import { Schema } from 'mongoose';

export const DatePlugin = (schema: Schema, options?) => {
  schema.add({ createdAt: Number, updatedAt: Number });

  schema.pre('save', function(next) {
    const that = this;
    if (!that['createdAt']){
        that['createdAt'] = +new Date();
    }
    if (!that['updatedAt']){
        that['updatedAt'] = +new Date();
    }
    next();
  });

  schema.pre('updateMany', function(next) {
    const that = this;
    that['updatedAt'] = +new Date();
    next();
  });

  schema.pre('updateOne', function(next) {
    const that = this;
    that['updatedAt'] = +new Date();
    next();
  });
};
