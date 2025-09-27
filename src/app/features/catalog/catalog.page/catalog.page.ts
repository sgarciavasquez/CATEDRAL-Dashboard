import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router'; 
import { HeaderComponent } from '../../../shared/components/header/header';
import { ProductCardComponent } from '../../../shared/components/products card/product-card';
import { Product } from '../../../shared/components/products card/models/product';
import { FooterComponent } from '../../../shared/components/footer/footer';



@Component({
  standalone: true,
  selector: 'app-catalog-page',
  imports: [CommonModule, HeaderComponent, ProductCardComponent, RouterLink , FooterComponent,],
  templateUrl: './catalog.page.html'
})
export class CatalogPage {
  private route = inject(ActivatedRoute);

  title = 'Perfumes';
  sort: 'mas-vendidos' | 'precio' = 'mas-vendidos';

  products: Product[] = [
    { id:'p1', name:'Q51 Santal 33 (Le Labo) 100 ML', price:18000, imageUrl:'assets/p1.png', stock:5, rating:4.8 },
    { id:'p2', name:'Q52 Ombré Leather (Tom Ford) 100 ML', price:18000, imageUrl:'assets/p2.png', stock:0, rating:4.6 },
    { id:'p3', name:'F03 Oscar de la Renta 100 ML',        price:13000, imageUrl:'assets/p3.png', stock:12, rating:4.5 },
  ];

  constructor() {
    this.route.queryParamMap.subscribe(q => {
      const cat = q.get('cat') ?? '';
      this.title = this.titleFromCat(cat);
    });
  }

  private titleFromCat(cat: string) {
    switch (cat) {
      case 'mujer-nicho':   return 'Perfumes de Nicho para Mujeres';
      case 'hombre-nicho':  return 'Perfumes de Nicho para Hombres';
      case 'mujer-dis':     return 'Perfumes de Diseñador para Mujeres';
      case 'hombre-dis':    return 'Perfumes de Diseñador para Hombres';
      default:              return 'Perfumes';
    }
  }
}
