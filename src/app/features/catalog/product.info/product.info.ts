import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ProductService } from '../../../shared/services/productservice/product.service';
import { UiProduct, toUiProduct } from '../../../shared/services/productservice/product.ui';
import { HeaderComponent } from '../../../shared/components/header/header';
import { FooterComponent } from '../../../shared/components/footer/footer';
import { CartService } from '../../../shared/services/cartservice/cart';

@Component({
  selector: 'app-product-info',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './product.info.html',
})
export class ProductInfo implements OnInit {
  private route = inject(ActivatedRoute);
  private products = inject(ProductService);
  private cart = inject(CartService);

  p?: UiProduct;
  loading = true;
  error = '';
  qty = 1;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.products.get(id).subscribe({
      next: api => { this.p = toUiProduct(api); this.loading = false; },
      error: err => { this.error = err?.error?.message ?? 'No se pudo cargar el producto'; this.loading = false; }
    });
  }


  dec() { if (this.qty > 1) this.qty--; }
  inc() { if (!this.p) return; this.qty++; }

  addToCart() {
    if (!this.p) return;
    // tu cart usa Product; pasamos lo mínimo requerido
    this.cart.add({
      id: this.p.id,
      name: `${this.p.code} — ${this.p.name}`,
      price: this.p.price,
      imageUrl: this.p.imageUrl,
      inStock: this.p.inStock,
      rating: this.p.rating ?? 4.7
    } as any, this.qty);
  }
}
