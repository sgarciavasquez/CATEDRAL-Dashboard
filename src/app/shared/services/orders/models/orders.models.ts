export type OrderStatus = 'pending' | 'completed' | 'cancelled';

export interface ApiOrderItem {
  productId: string;
  code?: string;
  name: string;
  imageUrl?: string;
  price: number;
  quantity: number;
}

export interface ApiReservation {
  _id: string;
  code?: string; 
  customer: { id?: string; name: string; email?: string; phone?: string };
  status: OrderStatus;
  createdAt: string;    
  reserveDate?: string; 
  items: ApiOrderItem[];
  total?: number;       
}

export interface UiOrderItem {
  code?: string;
  name: string;
  imageUrl: string;
  quantity: number;
  price: number;
  lineTotal: number;
}

export interface UiReservation {
  id: string;
  code: string;
  customerName: string;
  status: OrderStatus;
  createdAt: Date;
  reserveDate?: Date;
  items: UiOrderItem[];
  total: number;
}

export function toUiReservation(a: ApiReservation): UiReservation {
  const items: UiOrderItem[] = (a.items ?? []).map(it => ({
    code: it.code,
    name: it.name,
    imageUrl: it.imageUrl || 'assets/p1.png',
    quantity: it.quantity,
    price: it.price,
    lineTotal: Math.max(0, (it.quantity ?? 0) * (it.price ?? 0)),
  }));
  const total = a.total ?? items.reduce((s, x) => s + x.lineTotal, 0);

  return {
    id: a._id,
    code: a.code ?? a._id.slice(-5),
    customerName: a.customer?.name ?? '',
    status: a.status,
    createdAt: new Date(a.createdAt),
    reserveDate: a.reserveDate ? new Date(a.reserveDate) : undefined,
    items,
    total,
  };
}
