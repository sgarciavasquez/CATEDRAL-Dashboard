import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';

import { ProductService } from '../../../shared/services/productservice/product.service';
import { UiProduct } from '../../../shared/services/productservice/product.ui';
import { ProductCardComponent } from '../../../shared/components/products card/product-card';
import { HeaderComponent } from '../../../shared/components/header/header';
import { FooterComponent } from '../../../shared/components/footer/footer';
import { CategoryService } from '../../../shared/services/productservice/category.service';
import { ApiCategory } from '../../../shared/services/productservice/product.api';

// Cualquier slug de categoría normalizado o '' para "todas"
type CatKey = '' | string;

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

  // categorías con slug normalizado
  categories: (ApiCategory & { slug: string })[] = [];

  /** todos los productos cargados desde la API */
  all: UiProduct[] = [];
  /** productos filtrados (categoría + búsqueda) */
  items: UiProduct[] = [];

  loading = true;

  /** slug normalizado de la categoría seleccionada, '' = todas */
  selectedCategory: CatKey = '';

  /** término de búsqueda (texto del input) */
  searchTerm = '';

  private sub?: Subscription;

  /** Normaliza cadena: minúsculas, sin tildes y sin espacios extremos */
  private norm(s: string): string {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  /** Devuelve tags (slugs) del producto (ya vienen normalizados desde listUi) */
  private tagsOf(p: UiProduct): string[] {
    return Array.isArray(p.categoryNames) ? p.categoryNames : [];
  }



  /** ¿El producto tiene esta categoría (slug)? */
  private matchesCategory(p: UiProduct, key: CatKey): boolean {
    if (!key) return true; // '' = todas

    const tags = this.tagsOf(p);

    // Combos especiales: Diseñador Mujer / Diseñador Hombre
    if (key === 'mujer-dis') {
      return tags.includes('mujer') && tags.includes('disenador');
    }

    if (key === 'hombre-dis') {
      return tags.includes('hombre') && tags.includes('disenador');
    }

    // Categorías simples (Diseñador, Nicho, Mujer, Hombre, etc.)
    return tags.includes(key);
  }

  /** ¿El producto matchea el texto buscado? (por nombre, código o categorías) */
  private matchesSearch(p: UiProduct, q: string): boolean {
    if (!q) return true;

    const composite = `${p.code || ''} ${p.name || ''} ${(p.categoryNames || []).join(' ')}`;
    const haystack = this.norm(composite);

    return haystack.includes(q);
  }

  /** Aplica filtro de categoría + búsqueda sobre `all` y actualiza `items` */
  private applyFilters(): void {
    let result = this.all;

    // 1) filtro por categoría
    if (this.selectedCategory) {
      result = result.filter(p => this.matchesCategory(p, this.selectedCategory));
    }

    // 2) filtro por texto de búsqueda
    const q = this.norm(this.searchTerm);
    if (q) {
      result = result.filter(p => this.matchesSearch(p, q));
    }

    this.items = result;
  }

  /** handler del input de búsqueda */
  onSearch(term: string): void {
    this.searchTerm = term || '';
    this.applyFilters();
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

    // Cargamos categorías y les agregamos el slug normalizado
    this.categoriesSrv.list().subscribe({
      next: (cats) => {
        this.categories = cats.map(c => ({
          ...c,
          slug: this.norm(c.name),
        }));
      },
      error: () => console.error('Error cargando categorías'),
    });

    // Escuchamos cambios de productos + queryParams (cat)
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
