import { Component, EventEmitter, Output, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CategoryService } from '../../../../shared/services/productservice/category.service';
import { ApiCategory } from '../../../../shared/services/productservice/product.api';

@Component({
  selector: 'categories-crud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule],
  templateUrl: './categories-crud.component.html',
})
export class CategoriesCrudComponent {
  private cs = inject(CategoryService);
  private fb = inject(FormBuilder);

  categories = signal<ApiCategory[]>([]);
  creating = signal(false);
  saving = signal(false);
  editId = signal<string | null>(null);

  @Output() changed = new EventEmitter<void>();
  @ViewChild('editInput') editInput?: ElementRef<HTMLInputElement>;

  createForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  editForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  constructor() { this.load(); }

  // helpers
  private normalizeName(v: string | null | undefined) {
    return (v ?? '').trim().replace(/\s+/g, ' ');
  }
  private existsName(name: string, excludeId?: string) {
    const n = name.toLowerCase();
    return this.categories().some(c => c._id !== excludeId && c.name.toLowerCase() === n);
  }
  trackById = (_: number, c: ApiCategory) => c._id;

  // data
  load() {
    this.cs.list().subscribe({ next: arr => this.categories.set(arr) });
  }

  create() {
    const raw = this.createForm.value.name!;
    const name = this.normalizeName(raw);
    if (!name) return;
    if (this.existsName(name)) {
      this.createForm.get('name')?.setErrors({ duplicate: true });
      return;
    }
    this.creating.set(true);
    this.cs.create(name).subscribe({
      next: cat => {
        this.categories.set([cat, ...this.categories()]);
        this.createForm.reset();
        this.creating.set(false);
        this.changed.emit();
      },
      error: () => this.creating.set(false),
    });
  }

  startEdit(c: ApiCategory) {
    this.editId.set(c._id);
    this.editForm.reset({ name: c.name });
    setTimeout(() => this.editInput?.nativeElement?.focus(), 0);
  }

  cancelEdit() { this.editId.set(null); }

  saveEdit() {
    const id = this.editId();
    if (!id || this.editForm.invalid) return;
    const name = this.normalizeName(this.editForm.value.name!);
    if (!name) return;
    if (this.existsName(name, id)) {
      this.editForm.get('name')?.setErrors({ duplicate: true });
      return;
    }
    this.saving.set(true);
    this.cs.update(id, name).subscribe({
      next: cat => {
        this.categories.set(this.categories().map(x => x._id === id ? cat : x));
        this.editId.set(null);
        this.saving.set(false);
        this.changed.emit();
      },
      error: () => this.saving.set(false),
    });
  }

  remove(c: ApiCategory) {
    if (!confirm(`Eliminar categoría "${c.name}"?`)) return;
    this.cs.remove(c._id).subscribe({
      next: () => {
        this.categories.set(this.categories().filter(x => x._id !== c._id));
        this.changed.emit();
      },
    });
  }
}
