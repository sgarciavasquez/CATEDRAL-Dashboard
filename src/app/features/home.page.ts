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
    RouterLink, FooterComponent ,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.css'],
})
export class HomeComponent implements OnInit {
  private productsSrv = inject(ProductService);

  bestSellers: Product[] = [];
  loading = true;
  error = '';

  private toCardModel = (u: UiProduct): Product => ({
    id: u.id,
    // mostramos "CODE — NOMBRE" sin tocar la card
    name: `${u.code} — ${u.name}`,
    price: u.price,
    imageUrl: u.imageUrl,
    stock: 0,               // sin qty por ahora
    rating: u.rating ?? 4.7
  });

  ngOnInit(): void {
    this.productsSrv.listUi().subscribe({
      next: list => {
        this.bestSellers = list.slice(0, 6).map(this.toCardModel);
        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.message ?? 'No se pudieron cargar los productos';
        this.loading = false;
      }
    });
  }
}
