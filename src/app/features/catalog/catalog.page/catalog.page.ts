import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, combineLatest, map } from 'rxjs';

import { ProductService } from '../../../shared/services/productservice/product.service';
import { UiProduct } from '../../../shared/services/productservice/product.ui';
import { ProductCardComponent } from '../../../shared/components/products card/product-card';
import { HeaderComponent } from '../../../shared/components/header/header';
import { FooterComponent } from '../../../shared/components/footer/footer';

// Claves de RUTA (no toques product.ui.ts)
type CatRouteKey = 'nicho-mujer' | 'nicho-hombre' | 'mujer-dis' | 'hombre-dis' | 'nicho';

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

  all: UiProduct[] = [];
  items: UiProduct[] = [];
  loading = true;
  selectedKey: CatRouteKey | '' = '';

  private sub?: Subscription;

  private has(names: string[], k: 'mujer'|'hombre'|'nicho') {
    return names.includes(k);
  }

  /** Lógica de filtrado exacta que pediste */
  private matches(key: CatRouteKey, p: UiProduct): boolean {
    const names = (p.categoryNames ?? []).map(n => (n || '').toLowerCase());
    const M = this.has(names, 'mujer');
    const H = this.has(names, 'hombre');
    const N = this.has(names, 'nicho');

    switch (key) {
      case 'nicho-mujer':  return N && M;     // Nicho + Mujer
      case 'nicho-hombre': return N && H;     // Nicho + Hombre
      case 'mujer-dis':    return M && !N;    // Diseñador Mujer (sin nicho)
      case 'hombre-dis':   return H && !N;    // Diseñador Hombre (sin nicho)
      case 'nicho':        return N;          // Cualquier Nicho
      default:             return true;
    }
  }

  get title(): string {
    switch (this.selectedKey) {
      case 'nicho-mujer':  return 'Perfumes de Nicho para Mujeres';
      case 'nicho-hombre': return 'Perfumes de Nicho para Hombres';
      case 'mujer-dis':    return 'Perfumes de Diseñador para Mujeres';
      case 'hombre-dis':   return 'Perfumes de Diseñador para Hombres';
      case 'nicho':        return 'Perfumes de Nicho';
      default:             return 'Perfumes';
    }
  }

  ngOnInit(): void {
    const data$ = this.productsSrv.listUi();
    const qp$   = this.route.queryParams;

    this.sub = combineLatest([data$, qp$]).pipe(
      map(([list, params]) => {
        this.all = list ?? [];
        const raw = (params['cat'] ?? '').toLowerCase();
        const allowed: CatRouteKey[] = ['nicho-mujer','nicho-hombre','mujer-dis','hombre-dis','nicho'];
        this.selectedKey = (allowed.includes(raw as CatRouteKey) ? raw as CatRouteKey : '');

        if (!this.selectedKey) return this.all;
        return this.all.filter(p => this.matches(this.selectedKey as CatRouteKey, p));
      })
    ).subscribe(filtered => {
      this.items = filtered;
      this.loading = false;
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
