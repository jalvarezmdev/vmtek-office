import { customType } from 'drizzle-orm/pg-core';

export const money = (name: string) =>
  customType<{ data: number; driverData: string }>({
    dataType() {
      return 'numeric(12, 2)';
    },
    toDriver(value: number) {
      return value.toFixed(2);
    },
    fromDriver(value: string) {
      return Number(value);
    },
  })(name);
