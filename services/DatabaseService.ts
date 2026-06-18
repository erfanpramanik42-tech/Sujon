import Dexie, { type EntityTable } from 'dexie';
import { Shop, Place, Area, SalesRoute, Visit, Product, Order, CompetitorTrack, Dealer, Payment, Expense, Target } from '../types';

export class FieldProDB extends Dexie {
  shops!: EntityTable<Shop, 'id'>;
  places!: EntityTable<Place, 'id'>;
  areas!: EntityTable<Area, 'id'>;
  routes!: EntityTable<SalesRoute, 'id'>;
  visits!: EntityTable<Visit, 'id'>;
  products!: EntityTable<Product, 'id'>;
  orders!: EntityTable<Order, 'id'>;
  competitorTracks!: EntityTable<CompetitorTrack, 'id'>;
  dealers!: EntityTable<Dealer, 'id'>;
  payments!: EntityTable<Payment, 'id'>;
  expenses!: EntityTable<Expense, 'id'>;
  targets!: EntityTable<Target, 'id'>;

  constructor() {
    super('FieldProDB');
    this.version(1).stores({
      shops: 'id, name, areaId',
      places: 'id, name',
      areas: 'id, name',
      routes: 'id, date, status',
      visits: '++id, shopId, timestamp, date',
      products: 'id, name, category',
      orders: 'id, shopId, date, status',
      competitorTracks: 'id, shopId, date',
      dealers: 'id, name, areaId',
      payments: 'id, shopId, date',
      expenses: 'id, date, category',
      targets: 'id, type, month'
    });
  }
}

export const db = new FieldProDB();
