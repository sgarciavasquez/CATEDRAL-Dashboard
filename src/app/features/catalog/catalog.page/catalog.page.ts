import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';

import { ProductService } from '../../../shared/services/productservice/product.service';
import { UiProduct } from '../../../shared/services/productservice/product.ui';
import { ProductCardComponent } from '../../../shared/components/products card/product-card';
import { HeaderComponent } from '../../../shared/components/header/header';
import { FooterComponent } from '../../../shared/components/footer/footer';
import { CategoryService } from '../../../shared/services/productservice/category.service';
import { ApiCategory } from '../../../shared/services/productservice/product.api';
import { FormsModule } from '@angular/forms';

// Cualquier slug de categoría normalizado o '' para "todas"
type CatKey = '' | string;

// NUEVO: opciones de ordenamiento
type SortOption = 'relevance' | 'priceAsc' | 'priceDesc' | 'name';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NgFor,
    FormsModule,
    ProductCardComponent,
    HeaderComponent,
    FooterComponent,
  ],
  templateUrl: './catalog.page.html',
  styleUrls: ['./catalog.page.css'],
})
export class CatalogPage implements OnInit, OnDestroy {

  private route = inject(ActivatedRoute);
  private productsSrv = inject(ProductService);
  private categoriesSrv = inject(CategoryService);

  categories: (ApiCategory & { slug: string })[] = [];
  all: UiProduct[] = [];
  items: UiProduct[] = [];

  loading = true;

  selectedCategory: CatKey = '';
  searchTerm = '';
  sortOption: SortOption = 'relevance';

  private sub?: Subscription;

  private norm(s: string): string {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private tagsOf(p: UiProduct): string[] {
    return Array.isArray(p.categoryNames) ? p.categoryNames : [];
  }

  private matchesCategory(p: UiProduct, key: CatKey): boolean {
    if (!key) return true;

    const tags = this.tagsOf(p);

    if (key === 'mujer-dis') return tags.includes('mujer') && tags.includes('disenador');
    if (key === 'hombre-dis') return tags.includes('hombre') && tags.includes('disenador');

    return tags.includes(key);
  }

  private matchesSearch(p: UiProduct, q: string): boolean {
    if (!q) return true;

    const composite =
      `${p.code || ''} ${p.name || ''} ${(p.categoryNames || []).join(' ')}`;
    const haystack = this.norm(composite);

    return haystack.includes(q);
  }

  applyFilters(): void {
    let result = this.all;
    if (this.selectedCategory) {
      result = result.filter(p => this.matchesCategory(p, this.selectedCategory));
    }
    const q = this.norm(this.searchTerm);
    if (q) {
      result = result.filter(p => this.matchesSearch(p, q));
    }
    this.applySort(result);

    this.items = result;
  }

  private applySort(arr: UiProduct[]) {
    switch (this.sortOption) {
      case 'priceAsc':
        arr.sort((a, b) => a.price - b.price);
        break;

      case 'priceDesc':
        arr.sort((a, b) => b.price - a.price);
        break;

      case 'name':
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;

      default:
        break;
    }
  }

  onSearch(term: string): void {
    this.searchTerm = term || '';
    this.applyFilters();
  }

  private sortList(list: UiProduct[]): UiProduct[] {
    const arr = [...list];

    switch (this.sortOption) {
      case 'priceAsc':
        return arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));

      case 'priceDesc':
        return arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));

      case 'name':
        return arr.sort((a, b) =>
          (a.name ?? '').localeCompare(b.name ?? '', 'es', {
            sensitivity: 'base',
          })
        );

      case 'relevance':
      default:
        return arr; // Mantener tal cual viene la API
    }
  }

  get title(): string {
    if (!this.selectedCategory) return 'Perfumes';

    const cat = this.selectedCategory;

    if (cat === 'nicho') return 'Perfumes de Nicho';
    if (cat === 'disenador') return 'Perfumes de Diseñador';
    if (cat === 'mujer') return 'Perfumes de Mujer';
    if (cat === 'hombre') return 'Perfumes de Hombre';

    if (cat === 'mujer-dis') return 'Perfumes de Diseñador · Mujer';
    if (cat === 'hombre-dis') return 'Perfumes de Diseñador · Hombre';

    const pretty = cat.charAt(0).toUpperCase() + cat.slice(1);
    return `Perfumes · ${pretty}`;
  }

  ngOnInit(): void {
    const data$ = this.productsSrv.listUi();
    const qp$ = this.route.queryParams;
    this.categoriesSrv.list().subscribe({
      next: (cats) => {
        this.categories = cats.map((c) => ({
          ...c,
          slug: this.norm(c.name),
        }));
      },
      error: () => console.error('Error cargando categorías'),
    });

    this.sub = combineLatest([data$, qp$]).subscribe({
      next: ([list, params]) => {
        this.all = list ?? [];

        const rawCat = (params['cat'] ?? '') as string;
        this.selectedCategory = this.norm(rawCat);

        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando catálogo', err);
        this.loading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
