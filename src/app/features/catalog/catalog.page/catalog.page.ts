import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, combineLatest, map } from 'rxjs';

import { ProductService } from '../../../shared/services/productservice/product.service';
import { UiProduct } from '../../../shared/services/productservice/product.ui';
import { ProductCardComponent } from '../../../shared/components/products card/product-card';
import { HeaderComponent } from '../../../shared/components/header/header';
import { FooterComponent } from '../../../shared/components/footer/footer';
import { CategoryService } from '../../../shared/services/productservice/category.service';
import { ApiCategory } from '../../../shared/services/productservice/product.api';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent, HeaderComponent, FooterComponent],
  templateUrl: './catalog.page.html',
  styleUrls: ['./catalog.page.css'],
})
export class CatalogPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private productsSrv = inject(ProductService);
  private categoriesSrv = inject(CategoryService);

  categories: ApiCategory[] = [];
  all: UiProduct[] = [];
  items: UiProduct[] = [];
  loading = true;
  selectedCategory: string = '';

  private sub?: Subscription;

  /** Filtra productos según categoría seleccionada */
  private matchesCategory(p: UiProduct): boolean {
    if (!this.selectedCategory) return true;
    const names = (p.categoryNames ?? []).map(n => n.toLowerCase());
    return names.includes(this.selectedCategory.toLowerCase());
  }

  get title(): string {
    if (!this.selectedCategory) return 'Perfumes';
    return `Perfumes de ${this.selectedCategory.charAt(0).toUpperCase()}${this.selectedCategory.slice(1)}`;
  }

  ngOnInit(): void {
    const data$ = this.productsSrv.listUi();
    const qp$ = this.route.queryParams;
    this.categoriesSrv.list().subscribe({
      next: (cats) => this.categories = cats,
      error: () => console.error('Error cargando categorías')
    });

    this.sub = combineLatest([data$, qp$]).pipe(
      map(([list, params]) => {
        this.all = list ?? [];
        const raw = (params['cat'] ?? '').toLowerCase();
        this.selectedCategory = raw;

        // Si no hay categoría, muestra todo
        if (!this.selectedCategory) return this.all;

        // Filtra productos por categoría seleccionada
        return this.all.filter(p => this.matchesCategory(p));
      })
    ).subscribe(filtered => {
      this.items = filtered;
      this.loading = false;
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
