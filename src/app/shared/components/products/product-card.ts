import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../shared/models/product';
import { CartService } from '../../../shared/services/cart';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.css'],
})
export class ProductCardComponent {
  @Input() product!: Product;
  constructor(private cart: CartService) {}
  add() { this.cart.add(this.product, 1); }
}
