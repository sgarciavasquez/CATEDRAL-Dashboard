import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router'; // 👈 AÑADIR
import { HeaderComponent } from '../../../shared/components/header/header';
import { ProductCardComponent } from '../../../shared/components/products card/product-card';
import { Product } from '../../../shared/components/products card/models/product';


@Component({
  standalone: true,
  selector: 'app-catalog-page',
  // 👇 AÑADIR RouterLink y RouterLinkActive
  imports: [CommonModule, HeaderComponent, ProductCardComponent, RouterLink, RouterLinkActive],
  templateUrl: './catalog.page.html'
})
export class CatalogPage {
  private route = inject(ActivatedRoute);

  all: Product[] = [
    { id:'p1', name:'Q51 Santal 33 (Le Labo) 100 ML', price:18000, imageUrl:'assets/p1.png', stock:5,  rating:4.9 },
    { id:'p2', name:'Q52 Ombré Leather (Tom Ford) 100 ML', price:18000, imageUrl:'assets/p2.png', stock:0,  rating:4.8 },
    { id:'p3', name:'F03 Oscar de la Renta 100 ML',        price:13000, imageUrl:'assets/p3.png', stock:12, rating:4.7 },
  ];

  cat  = this.route.snapshot.queryParamMap.get('cat')  ?? 'mas-vendidos';
  sort = this.route.snapshot.queryParamMap.get('sort') ?? 'mas-vendidos';

  get items(): Product[] {
    const arr = [...this.all];
    if (this.sort === 'mas-vendidos') {
      // 👇 evita “possibly undefined”
      arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return arr;
  }
}
