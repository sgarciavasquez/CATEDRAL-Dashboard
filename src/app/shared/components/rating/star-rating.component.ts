import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.component.html',
})
export class StarRatingComponent {
  @Input() value = 0;          // valor actual (ej: promedio 4.3 -> puedes redondear fuera)
  @Input() showNumber = false; // mostrar "4/5"
  @Input() readOnly = false;   // <-- NUEVO: modo solo lectura

  @Output() valueChange = new EventEmitter<number>();

  starsArray = [1, 2, 3, 4, 5];
  hover = 0;

  set(v: number) {
    if (this.readOnly) return;   // si es solo lectura, no hace nada
    this.value = v;
    this.valueChange.emit(v);
  }

  enter(v: number) {
    if (this.readOnly) return;
    this.hover = v;
  }

  leave() {
    if (this.readOnly) return;
    this.hover = 0;
  }
}
