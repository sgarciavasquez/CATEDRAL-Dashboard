import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header';
import { CartItem, CartService } from '../../shared/services/cartservice/cart';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, HeaderComponent, DecimalPipe],
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.css'],
})
export class CartPage {
  private cart = inject(CartService);

  items$ = this.cart.items$;

  // 3) Acciones
  inc(it: CartItem)   { this.cart.add(it.product, 1); }
  dec(it: CartItem)   { this.cart.add(it.product, -1); }
  remove(it: CartItem){ this.cart.remove(it.product.id); }
  clear()             { this.cart.clear(); }
  total()             { return this.cart.total(); }
}