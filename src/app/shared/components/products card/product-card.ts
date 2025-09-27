import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cartservice/cart';
import { Product } from './models/product';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.css'],
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Input() variant: 'default' | 'popular' = 'default';
  added = false;
  private cart = inject(CartService);

  stars(n = 5) { return Array.from({ length: n }); }


  add() {
    this.cart.add(this.product, 1);
    this.added = true;
    setTimeout(() => this.added = false, 1000);
  }

  onAddToCart(ev?: Event) {
    ev?.stopPropagation();
    if (!this.product) return;
    this.cart.add(this.product);
  }
}
