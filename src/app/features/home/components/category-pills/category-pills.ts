import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UiProduct } from '../../../../shared/services/productservice/product.ui';

type CatKey = '' | string;

interface Cat { key: CatKey; label: string; img: string; }

@Component({
  selector: 'app-category-pills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-pills.html',
  styleUrls: ['./category-pills.css'],
})
export class CategoryPillsComponent {
  private router = inject(Router);
  private tagsOf(p: UiProduct): string[] {
  return Array.isArray(p.categoryNames) ? p.categoryNames : [];
}

  cats: Cat[] = [
    { key: 'mujer-dis',  label: 'Diseñador Mujer',  img: 'assets/p1.png' },
    { key: 'hombre-dis', label: 'Diseñador Hombre', img: 'assets/p2.png' },
    { key: 'nicho',      label: 'Nicho',            img: 'assets/p3.png' },
  ];

  go(key: CatKey) {
    this.router.navigate(['/catalogo'], { queryParams: { cat: key, sort: 'mas-vendidos' } });
  }
}
