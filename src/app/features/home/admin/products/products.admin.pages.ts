import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { HeaderComponent } from '../../../../shared/components/header/header';
import { FooterComponent } from '../../../../shared/components/footer/footer';

import { ProductService, SaveProductPayload } from '../../../../shared/services/productservice/product.service';
import { ApiCategory, ApiProduct } from '../../../../shared/services/productservice/product.api';
import { CategoryService } from '../../../../shared/services/productservice/category.service';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { CategoriesCrudComponent } from '../categorys/categories-crud.component';
import { of, switchMap } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-products-admin',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderComponent,
    FooterComponent,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule
  ],
  templateUrl: './products.admin.page.html',
  styleUrls: ['./products.admin.page.css'],
})
export class ProductsAdminPage implements OnInit {
  private fb = inject(FormBuilder);
  private products = inject(ProductService);
  private categoriesSrv = inject(CategoryService);
  private dialog = inject(MatDialog);

  loading = signal(true);
  list = signal<ApiProduct[]>([]);
  editingId = signal<string | null>(null);

  categories = signal<ApiCategory[]>([]);
  loadingCategories = signal<boolean>(true);

  /** id del documento de stock (para /api/stock/:stockId/add) */
  currentStockId: string | null = null;

  /** cuánto sumar al guardar */
  addStockCtrl = this.fb.control<number | null>(0);

  form = this.fb.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    img_url: [''],
    categoriesIds: this.fb.control<string[]>([]),
    initialQuantity: [0], // solo al crear
  });

  ngOnInit(): void {
    this.load();
    this.loadCategories();
  }

  // ===== data =====
  load() {
    this.loading.set(true);
    this.products.list().subscribe({
      next: data => { this.list.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  loadCategories() {
    this.loadingCategories.set(true);
    this.categoriesSrv.list().subscribe({
      next: cats => { this.categories.set(cats); this.loadingCategories.set(false); },
      error: () => this.loadingCategories.set(false),
    });
  }

  // ===== form actions =====
  startCreate() {
    this.editingId.set(null);
    this.currentStockId = null;
    this.form.reset({
      code: '', name: '', price: 0, img_url: '',
      categoriesIds: [], initialQuantity: 0,
    });
    this.addStockCtrl.setValue(0);
  }

  startEdit(p: ApiProduct) {
    this.editingId.set(p._id);

    // intenta tomar stockId desde la lista (si vino)
    const s: any = Array.isArray((p as any).stock) ? (p as any).stock?.[0] : (p as any).stock;
    this.currentStockId = s?._id ?? null;

    const catIds: string[] =
      Array.isArray(p.categories)
        ? (typeof p.categories[0] === 'string'
          ? (p.categories as string[])
          : (p.categories as any[]).map(c => c?._id).filter(Boolean))
        : [];

    this.form.reset({
      code: p.code, name: p.name, price: p.price,
      img_url: p.img_url ?? '', categoriesIds: catIds,
      initialQuantity: 0, // no se usa al editar
    });
    this.addStockCtrl.setValue(0);

    // si no teníamos stockId, lo traemos del detalle
    if (!this.currentStockId) {
      this.products.get(p._id).subscribe(full => {
        const fs: any = Array.isArray((full as any).stock) ? (full as any).stock?.[0] : (full as any).stock;
        this.currentStockId = fs?._id ?? null;
      });
    }
  }

  openCategoriesDialog() {
    this.dialog.open(CategoriesCrudComponent, {
      width: '520px',
      maxWidth: '95vw',
      autoFocus: true,
      panelClass: 'mat-elevation-z4'
    }).afterClosed().subscribe(() => this.loadCategories());
  }

  submit() {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: SaveProductPayload = {
      code: raw.code!.trim(),
      name: raw.name!.trim(),
      price: Number(raw.price),
      img_url: raw.img_url?.trim() || undefined,
      categories: raw.categoriesIds && raw.categoriesIds.length ? raw.categoriesIds : undefined,
      initialQuantity: this.editingId() ? undefined : Number(raw.initialQuantity ?? 0),
    };

    const id = this.editingId();

    // === EDITAR ===
    if (id) {
      const add = Number(this.addStockCtrl.value ?? 0);

      this.products.update(id, payload).pipe(
        switchMap(() => {
          // si no hay que sumar stock, terminamos
          if (!(Number.isFinite(add) && add > 0)) return of(null);

          // si ya tenemos stockId, sumamos; si no, pedimos el detalle y sumamos
          if (this.currentStockId) {
            return this.products.increaseStockByStockId(this.currentStockId, add);
          }
          return this.products.get(id).pipe(
            switchMap(full => {
              const s: any = Array.isArray((full as any).stock) ? (full as any).stock?.[0] : (full as any).stock;
              const stockId = s?._id;
              return stockId ? this.products.increaseStockByStockId(stockId, add) : of(null);
            })
          );
        })
      ).subscribe({
        next: () => { this.startCreate(); this.load(); },
        error: err => alert(err?.error?.message ?? 'No se pudo guardar')
      });

      return;
    }

    // === CREAR === (usa initialQuantity en el backend)
    this.products.create(payload).subscribe({
      next: () => { this.startCreate(); this.load(); },
      error: err => alert(err?.error?.message ?? 'No se pudo guardar')
    });
  }

  remove(p: ApiProduct) {
    if (!confirm(`Eliminar ${p.code} — ${p.name}?`)) return;
    this.products.remove(p._id).subscribe({
      next: () => this.load(),
      error: err => alert(err?.error?.message ?? 'No se pudo eliminar')
    });
  }

  getCategoryName(id: string): string {
    const cat = this.categories().find(c => c._id === id);
    return cat ? cat.name : '—';
  }

  unselectCategory(id: string) {
    const ctrl = this.form.get('categoriesIds')!;
    const next = (ctrl.value || []).filter((x: string) => x !== id);
    ctrl.setValue(next);
    ctrl.markAsDirty();
    ctrl.updateValueAndValidity();
  }

  clearCategories() {
    const ctrl = this.form.get('categoriesIds')!;
    ctrl.setValue([]);
    ctrl.markAsDirty();
    ctrl.updateValueAndValidity();
  }

  displayCategories(p: ApiProduct): string {
    const cats: any[] = (p as any)?.categories ?? [];
    if (!cats.length) return '—';
    if (typeof cats[0] === 'string') {
      return (cats as string[]).map(id => this.getCategoryName(id) || id).join(', ');
    }
    return (cats as any[]).map(c => c?.name ?? c?._id ?? '—').join(', ');
  }
}
