import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../shared/components/products card/models/product';
import { HeaderComponent } from '../shared/components/header/header';
import { ProductCardComponent } from '../shared/components/products card/product-card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ProductCardComponent],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.css'],
})
export class HomeComponent {
  popular: Product[] = [
    { id:'p1', name:'Q51 Santal 33 (Le Labo) 100 ML', price:18000, imageUrl:'assets/p1.png', stock:5, rating:4.5 },
    { id:'p2', name:'Q52 Ombré Leather (Tom Ford) 100 ML', price:18000, imageUrl:'assets/p2.png', stock:0, rating:4.7 },
    { id:'p3', name:'F03 Oscar de la Renta 100 ML', price:13000, imageUrl:'assets/p3.png', stock:12, rating:4.3 },
  ];
}
