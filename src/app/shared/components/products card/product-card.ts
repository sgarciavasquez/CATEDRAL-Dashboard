import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from './models/product';
import { CartService } from '../../services/cartservice/cart';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.css'],
})
export class ProductCardComponent {
  @Input() product!: Product;
  added = false;

  constructor(private cart: CartService) {}

  add(){
    this.cart.add(this.product, 1);
    this.added = true;
    setTimeout(() => this.added = false, 1000);
  }
}
