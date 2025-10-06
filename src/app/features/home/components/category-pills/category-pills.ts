import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // para *ngFor
import { Router } from '@angular/router';

type CatKey = 'mujer-dis' | 'hombre-dis' | 'Nicho' ;
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

  cats: Cat[] = [
    { key: 'mujer-dis',  label: 'Diseñador Mujer',  img: 'assets/p1.png' },
    { key: 'hombre-dis', label: 'Diseñador Hombre', img: 'assets/p2.png' },
    { key: 'Nicho',      label: 'Nicho',            img: 'assets/p3.png' },
  ];

  go(key: CatKey) {
    this.router.navigate(['/catalogo'], { queryParams: { cat: key, sort: 'mas-vendidos' } });
  }
}
