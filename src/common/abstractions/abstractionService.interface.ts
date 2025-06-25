import { Document } from 'mongoose';
export interface AbstractionServiceInterface<T extends Document> {
  create(entity: T): Promise<T>;
  getOne(id: any): Promise<T>;
  getAll(): Promise<T[]>;
  update(id: any, entity: T): Promise<T>;
  delete(id: any);
}
