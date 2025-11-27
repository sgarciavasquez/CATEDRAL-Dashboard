import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../shared/components/header/header';
import { ProductCardComponent } from '../shared/components/products card/product-card';
import { RouterLink } from '@angular/router';
import { HeroCarouselComponent } from './home/components/hero-carousel/hero-carousel';
import { CategoryPillsComponent } from './home/components/category-pills/category-pills';
import { FooterComponent } from '../shared/components/footer/footer';
import { ProductService } from '../shared/services/productservice/product.service';
import { UiProduct } from '../shared/services/productservice/product.ui';
import { Product } from '../shared/components/products card/models/product';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    ProductCardComponent,
    HeroCarouselComponent,
    CategoryPillsComponent,
    RouterLink, FooterComponent,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.css'],
})
export class HomeComponent implements OnInit {
  private productsSrv = inject(ProductService);

  bestSellers: UiProduct[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    this.productsSrv.listUi().subscribe({
      next: list => {
        const sorted = [...list].sort(
          (a, b) => (b.rating ?? 0) - (a.rating ?? 0)
        );

        this.bestSellers = sorted.slice(0, 6);

        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.message ?? 'No se pudieron cargar los productos';
        this.loading = false;
      }
    });
  }
}