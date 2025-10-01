import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { HeaderComponent } from '../../../shared/components/header/header';
import { ProductCardComponent } from '../../../shared/components/products card/product-card';
import { FooterComponent } from '../../../shared/components/footer/footer';

import { ProductService } from '../../../shared/services/productservice/product.service';
import { UiProduct } from '../../../shared/services/productservice/product.ui';

type CatKey = 'mujer-dis' | 'hombre-dis' | 'nicho';

@Component({
  standalone: true,
  selector: 'app-catalog-page',
  imports: [CommonModule, HeaderComponent, ProductCardComponent, RouterLink, FooterComponent],
  templateUrl: './catalog.page.html'
})
export class CatalogPage {
  route = inject(ActivatedRoute);
  private productsSrv = inject(ProductService);

  title = 'Perfumes';
  loading = true;

  allProducts: UiProduct[] = [];
  products: UiProduct[] = [];

  currentCat: '' | CatKey = '';
  currentSort: 'mas-vendidos' | 'precio' = 'mas-vendidos';

  constructor() {
    // 1) cargar productos
    this.productsSrv.listUi().subscribe({
      next: list => {
        this.allProducts = list;
        this.loading = false;
        this.applyQueryParams();
      },
      error: () => (this.loading = false),
    });

    // 2) reaccionar a cambios de query params
    this.route.queryParamMap.subscribe(() => this.applyQueryParams());
  }

  private isCatKey(v: string): v is CatKey {
    return v === 'mujer-dis' || v === 'hombre-dis' || v === 'nicho';
  }

  private applyQueryParams() {
    const q = this.route.snapshot.queryParamMap;
    this.currentCat  = (q.get('cat')  ?? '') as '' | CatKey;
    this.currentSort = (q.get('sort') ?? 'mas-vendidos') as 'mas-vendidos' | 'precio';

    this.title = this.titleFromCat(this.currentCat);

    const filtered = this.isCatKey(this.currentCat)
      ? this.allProducts.filter(p => p.categoryKeys?.includes(this.currentCat as CatKey))
      : this.allProducts;

    this.products = [...filtered];
    if (this.currentSort === 'precio') {
      this.products.sort((a, b) => a.price - b.price);
    }
  }

  private titleFromCat(cat: '' | CatKey) {
    switch (cat) {
      case 'mujer-dis':  return 'Perfumes de Diseñador para Mujeres';
      case 'hombre-dis': return 'Perfumes de Diseñador para Hombres';
      case 'nicho':      return 'Perfumes de Nicho';
      default:           return 'Perfumes';
    }
  }
}
