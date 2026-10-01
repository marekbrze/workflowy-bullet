export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export function generateId(): string {
  return crypto.randomUUID();
}
