import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cartservice/cart';
import { Product } from './models/product';
import { UiProduct } from '../../services/productservice/product.ui';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule,RouterLink],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.css'],
})
export class ProductCardComponent {
  // ⬇️ Forzamos UiProduct para evitar perder inStock/categoryNames
  @Input() product!: UiProduct;
  @Input() variant: 'default' | 'popular' = 'default';

  private cart = inject(CartService);

  stars(n = 5) { return Array.from({ length: n }); }

  private toCartItem(p: UiProduct): Product {
    return {
      id: p.id,
      name: `${p.code} — ${p.name}`,
      price: p.price,
      imageUrl: p.imageUrl,
      inStock: p.inStock,           
      rating: p.rating ?? 4.7,      
    } as Product;
  }

   onAddToCart(ev?: Event) {
    ev?.stopPropagation();
    if (!this.product) return;
    this.cart.add(this.toCartItem(this.product), 1);
  }
}
