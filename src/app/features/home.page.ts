import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../shared/components/products card/models/product';
import { HeaderComponent } from '../shared/components/header/header';
import { ProductCardComponent } from '../shared/components/products card/product-card';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { Router, NavigationEnd } from '@angular/router';
import { filter, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ProductCardComponent, MatSidenavModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.css'],
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('cartDrawer') cartDrawer!: MatDrawer;

  constructor(private router: Router) {}

  popular: Product[] = [
    { id:'p1', name:'Q51 Santal 33 (Le Labo) 100 ML', price:18000, imageUrl:'assets/p1.png', stock:5, rating:4.5 },
    { id:'p2', name:'Q52 Ombré Leather (Tom Ford) 100 ML', price:18000, imageUrl:'assets/p2.png', stock:0, rating:4.7 },
    { id:'p3', name:'F03 Oscar de la Renta 100 ML', price:13000, imageUrl:'assets/p3.png', stock:12, rating:4.3 },
  ];

  ngAfterViewInit() {
    // abre si la URL comienza con /cart, cierra en otra ruta
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), startWith(null))
      .subscribe(() => {
        const wantCart = this.router.url.startsWith('/cart');
        setTimeout(() => wantCart ? this.cartDrawer.open() : this.cartDrawer.close());
      });
  }
}
