import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cartservice/cart';
import { Product } from './models/product';
import { UiProduct } from '../../services/productservice/product.ui';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.css'],
})
export class ProductCardComponent {
  // Ahora acepta Product O UiProduct (tipos compatibles con la card)
  @Input() product!: Product | UiProduct;
  @Input() variant: 'default' | 'popular' = 'default';

  added = false;
  private cart = inject(CartService);

  stars(n = 5) { return Array.from({ length: n }); }

  add() {
    // el cart sólo usa id/name/price/imageUrl → ambos tipos los traen
    this.cart.add(this.product as Product, 1);
    this.added = true;
    setTimeout(() => this.added = false, 1000);
  }

  onAddToCart(ev?: Event) {
    ev?.stopPropagation();
    if (!this.product) return;
    this.cart.add(this.product as Product);
  }
}
