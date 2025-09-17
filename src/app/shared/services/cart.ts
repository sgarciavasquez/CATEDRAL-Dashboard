import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product';

export interface CartItem { product: Product; qty: number; }
const KEY = 'cp_cart_v1';

@Injectable({ providedIn: 'root' })
export class CartService {
  private _items$ = new BehaviorSubject<CartItem[]>(this.load());
  readonly items$ = this._items$.asObservable();

  private load(): CartItem[] {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  }
  private save(items: CartItem[]) {
    localStorage.setItem(KEY, JSON.stringify(items));
    this._items$.next(items);
  }

  add(p: Product, delta = 1) {
    const items = [...this._items$.value];
    const i = items.findIndex(x => x.product.id === p.id);
    if (i >= 0) items[i] = { ...items[i], qty: Math.max(0, items[i].qty + delta) };
    else items.push({ product: p, qty: 1 });
    this.save(items.filter(x => x.qty > 0));
  }

  remove(id: string) { this.save(this._items$.value.filter(x => x.product.id !== id)); }
  clear() { this.save([]); }
  total() { return this._items$.value.reduce((t, x) => t + x.product.price * x.qty, 0); }
}
