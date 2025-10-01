import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe, AsyncPipe, NgIf, NgFor } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../shared/services/authservice/auth';
import { switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiUser, UserService } from '../../shared/services/user/user.service';
import { Reservation, ReservationService } from '../../shared/services/user/reservation.service';
import { FooterComponent } from "../../shared/components/footer/footer";
import { HeaderComponent } from "../../shared/components/header/header";

@Component({
    selector: 'app-profile-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, NgIf, NgFor, FooterComponent, HeaderComponent],
    templateUrl: './profile.page.html',
    styleUrls: ['./profile.page.css'],
})
export class ProfilePage {
    private fb = inject(FormBuilder);
    private userService = inject(UserService);
    private reservationService = inject(ReservationService);
    private auth = inject(AuthService);
    private router = inject(Router);

    loading = false;
    saving = false;
    error = '';
    okMsg = '';

    user: ApiUser | null = null;
    reservations: Reservation[] = [];

    // formulario de edición
    form = this.fb.group({
        name: ['', Validators.required],
        email: [{ value: '', disabled: true }, [Validators.required, Validators.email]], // no permitimos cambiar email aquí (opcional)
        phone: ['', Validators.required],
    });

    constructor() {
        this.load();
    }

    private load() {
        this.loading = true;
        this.userService.me().pipe(
            tap(u => {
                this.user = u;
                this.form.patchValue({
                    name: u.name || '',
                    email: u.email || '',
                    phone: u.phone || '',
                });
            }),
            switchMap(u => {
                if (!u || !(u._id ?? u.id)) return of([]);
                const id = u._id ?? u.id!;
                return this.reservationService.listByUser(id);
            })
        ).subscribe({
            next: (res) => {
                this.reservations = res;
                this.loading = false;
            },
            error: (err) => {
                this.error = err?.error?.message ?? 'No se pudo cargar perfil';
                this.loading = false;
            }
        });
    }

    save() {
        if (!this.user) return;
        if (this.form.invalid) {
            this.error = 'Revisa los campos';
            return;
        }
        this.saving = true; this.error = ''; this.okMsg = '';

        const payload = {
            name: this.form.get('name')!.value ?? '',
            phone: this.form.get('phone')!.value ?? '',
        };

        const id = this.user._id ?? this.user.id!;
        this.userService.update(id, payload).subscribe({
            next: (u) => { this.user = u; this.okMsg = 'Datos actualizados'; this.saving = false; },
            error: (e) => { this.error = e?.error?.message ?? 'Error al actualizar'; this.saving = false; }
        });
    }

    deleteAccount() {
        if (!this.user) return;
        if (!confirm('¿Seguro quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) return;
        const id = this.user._id ?? this.user.id!;
        this.userService.delete(id).subscribe({
            next: () => {
                // cierra sesión y lleva a home
                this.auth.logout();
                this.router.navigateByUrl('/');
            },
            error: (e) => {
                this.error = e?.error?.message ?? 'Error al eliminar cuenta';
            }
        });
    }

    // getter util para formato fecha en template
    formatDate(d?: string) {
        if (!d) return '';
        return new Date(d).toLocaleDateString();
    }
}
