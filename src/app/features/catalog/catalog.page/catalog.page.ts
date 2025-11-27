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

type CatKey = 'mujer-dis' | 'hombre-dis' | 'dis' | 'mujer' | 'hombre' | 'nicho' | '';

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
  selectedCategory: CatKey = '';

  private sub?: Subscription;

  /** Normaliza cadena: minúsculas y sin tildes */
  private norm(s: string): string {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /** Devuelve tags normalizados del producto */
  private tagsOf(p: UiProduct): string[] {
    const arr = Array.isArray(p.categoryNames) ? p.categoryNames : [];
    return arr.map(x => this.norm(x));
  }

  private has(tags: string[], tag: string): boolean {
    const t = this.norm(tag);
    return tags.some(x => x === t || x.includes(t));
  }

  /** Filtra por clave de categoría (soporta combinaciones AND) */
  private matchesCategory(p: UiProduct, key: CatKey): boolean {
    if (!key) return true;

    const tags = this.tagsOf(p);

    switch (key) {
      case 'mujer-dis':
        // requiere mujer AND diseñador
        return this.has(tags, 'mujer') && (this.has(tags, 'disenador') || this.has(tags, 'diseñador'));
      case 'hombre-dis':
        // requiere hombre AND diseñador
        return this.has(tags, 'hombre') && (this.has(tags, 'disenador') || this.has(tags, 'diseñador'));
      case 'dis':
        return (this.has(tags, 'disenador') || this.has(tags, 'diseñador'));
      case 'mujer':
        return this.has(tags, 'mujer');
      case 'hombre':
        return this.has(tags, 'hombre');
      case 'nicho':
        return this.has(tags, 'nicho');
      default:
        return true;
    }
  }

  get title(): string {
    const map: Record<string, string> = {
      'mujer-dis': 'Perfumes de Diseñador · Mujer',
      'hombre-dis': 'Perfumes de Diseñador · Hombre',
      'dis': 'Perfumes de Diseñador',
      'mujer': 'Perfumes de Mujer',
      'hombre': 'Perfumes de Hombre',
      'nicho': 'Perfumes de Nicho',
      '': 'Perfumes'
    };
    return map[this.selectedCategory ?? ''] || 'Perfumes';
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
        // solo aceptamos claves válidas
        const valid: CatKey[] = ['mujer-dis', 'hombre-dis', 'dis', 'mujer', 'hombre', 'nicho', ''];
        this.selectedCategory = (valid.includes(raw as CatKey) ? (raw as CatKey) : '');

        if (!this.selectedCategory) return this.all;
        return this.all.filter(p => this.matchesCategory(p, this.selectedCategory));
      })
    ).subscribe(filtered => {
      this.items = filtered;
      this.loading = false;
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}