export type OrderStatus = 'pending' | 'confirmed' | 'cancelled';

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
  customer?: { id?: string; name?: string; email?: string; phone?: string };
  user?: string | { _id?: string; id?: string; name?: string; email?: string; phone?: string };
  status: string;
  createdAt: string;
  reserveDate?: string;
  chatId?: string | string[];
  items?: ApiOrderItem[];
  reservationDetail?: Array<{
    product: string | {
      _id?: string;
      id?: string;
      code?: string;
      name?: string;
      imageUrl?: string;
      price?: number;
    };
    quantity: number;
    subtotal?: number;
  }>;

  total?: number;
  wasReopened?: boolean;
}

export interface UiOrderItem {
  productId?: string;
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
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  status: OrderStatus;
  createdAt: Date;
  reserveDate?: Date;
  items: UiOrderItem[];
  total: number;
  chatId?: string | string[];
  wasReopened?: boolean;
}

export function toUiReservation(a: ApiReservation): UiReservation {
  // ---- Cliente (customer o user) ----
  const userObj =
    (typeof a.user === 'object' && a.user) ? (a.user as any) : undefined;

  const customerId =
    a.customer?.id ??
    userObj?._id ?? userObj?.id ??
    (typeof a.user === 'string' ? a.user : '') ?? '';

  const customerName =
    a.customer?.name ??
    userObj?.name ??
    (customerId ? `ID ${String(customerId).slice(-6)}` : '');

  const customerEmail =
    a.customer?.email ?? userObj?.email ?? undefined;

  const customerPhone =
    a.customer?.phone ?? userObj?.phone ?? undefined;

  // ---- Items (items[] o reservationDetail[]) ----
  let items: UiOrderItem[] = [];

  if (Array.isArray(a.items)) {
    items = (a.items ?? []).map(it => ({
      productId: it.productId,
      code: it.code,
      name: it.name,
      imageUrl: it.imageUrl || 'assets/p1.png',
      quantity: it.quantity,
      price: it.price ?? 0,
      lineTotal: Math.max(0, (it.quantity ?? 0) * (it.price ?? 0)),
    }));
  } else if (Array.isArray(a.reservationDetail)) {
    items = (a.reservationDetail ?? []).map(rd => {
      const p = rd.product as any;
      const productId =
        typeof rd.product === 'string'
          ? rd.product
          : (p?._id ?? p?.id ?? '');

      const quantity = Number(rd.quantity ?? 0);
      const priceFromProduct = Number(p?.price ?? 0);
      const priceFromSubtotal =
        rd.subtotal != null && quantity > 0
          ? Number(rd.subtotal) / quantity
          : 0;
      const price = priceFromProduct || priceFromSubtotal || 0;

      const img =
        typeof rd.product === 'object' && p?.img_url
          ? p.img_url
          : 'assets/p1.png';

      return {
        productId: productId || undefined,
        code: typeof rd.product === 'object' ? (p?.code ?? undefined) : undefined,
        name: typeof rd.product === 'object' ? (p?.name ?? '(sin nombre)') : '(producto)',
        imageUrl: img,
        quantity,
        price,
        lineTotal: Math.max(0, quantity * price),
      };
    });
  }

  // ---- Total ----
  const computedTotal = items.reduce((s, x) => s + x.lineTotal, 0);
  const total = (typeof a.total === 'number' ? a.total : undefined) ?? computedTotal;

  // ---- Status normalizado ----
  const status = String(a.status || 'pending').toLowerCase() as OrderStatus;

  return {
    id: a._id,
    code: a.code ?? (a._id ? a._id.slice(-5) : ''),
    customerId: customerId || undefined,
    customerName,
    customerEmail,
    customerPhone,
    status,
    createdAt: new Date(a.createdAt),
    reserveDate: a.reserveDate ? new Date(a.reserveDate) : undefined,
    items,
    total,
    chatId: a.chatId,
  };
}
