// cart.page.ts
import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header';
import { CartItem, CartService } from '../../shared/services/cartservice/cart';
import { FooterComponent } from '../../shared/components/footer/footer';
import { OrdersService } from '../../shared/services/orders/orders.service';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GuestReserveDialogComponent, GuestReserveData } from '../cart/guest-reserve.dialog';
import { LeadsService } from '../../shared/services/leads/leads.service';


@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, HeaderComponent, DecimalPipe, FooterComponent, MatDialogModule],
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.css'],
})
export class CartPage {
  private cart   = inject(CartService);
  private orders = inject(OrdersService);
  private leads  = inject(LeadsService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  items$ = this.cart.items$;

  inc(it: CartItem)   { this.cart.add(it.product, 1); }
  dec(it: CartItem)   { this.cart.add(it.product, -1); }
  remove(it: CartItem){ this.cart.remove(it.product.id); }
  clear()             { this.cart.clear(); }
  total()             { return this.cart.total(); }

  // Reserva normal (usuario logeado). Si no hay user, cae a flujo invitado.
  reserve() {
    const userId = this.getUserId();
    if (!userId) {
      this.reserveAsGuest();
      return;
    }

    this.items$.pipe(take(1)).subscribe(items => {
      if (!items?.length) return;

      const reservationDetail = items.map((it) => {
        const qty   = Number((it as any).quantity ?? (it as any).qty ?? 1);
        const price = Number((it.product as any).price ?? 0);
        return {
          product: String((it.product as any).id),
          quantity: qty,
          subtotal: price * qty,
        };
      });

      const total = reservationDetail.reduce((s, d) => s + d.subtotal, 0);

      const payload = {
        user: userId,
        status: 'PENDING' as const,
        total,
        reservationDetail,
      };

      this.orders.create(payload).subscribe({
        next: _ => {
          this.cart.clear();
          this.router.navigate(['/admin/orders']); // ajusta si tu ruta es otra
        },
        error: err => alert(err?.error?.message ?? 'No se pudo crear la reserva'),
      });
    });
  }

  // Flujo invitado: abre formulario y envía lead
  private reserveAsGuest() {
    const ref = this.dialog.open<GuestReserveDialogComponent, void, GuestReserveData>(
      GuestReserveDialogComponent,
      { width: '420px', autoFocus: true, restoreFocus: true }
    );

    ref.afterClosed().pipe(take(1)).subscribe((data) => {
      if (!data) return; // canceló
      this.items$.pipe(take(1)).subscribe(items => {
        // Guardamos un lead con items resumidos, para que el admin contacte
        const summary = (items ?? []).map(it => ({
          productId: (it.product as any).id,
          name: (it.product as any).name ?? '',
          qty: Number((it as any).quantity ?? (it as any).qty ?? 1),
          price: Number((it.product as any).price ?? 0),
        }));
        const total = summary.reduce((s, x) => s + x.qty * x.price, 0);

        this.leads.create({
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: data.message ?? '',
          cart: summary,
          total,
          origin: 'cart-guest',
        }).subscribe({
          next: _ => {
            alert('Gracias. Te contactaremos para coordinar tu reserva.');
            // Decide si limpias el carro o lo dejas:
            // this.cart.clear();
          },
          error: err => alert(err?.error?.message ?? 'No se pudo enviar el formulario de contacto'),
        });
      });
    });
  }

  // Intenta obtener userId desde varias fuentes comunes
  private getUserId(): string | null {
    // 1) localStorage directo (si tú ya lo guardas)
    const ls = (localStorage.getItem('userId') || '').trim();
    if (ls) return ls;

    // 2) JWT en localStorage (típicos nombres de clave)
    const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
    if (token) {
      try {
        const [, payloadB64] = token.split('.');
        if (payloadB64) {
          const json = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
          // Intenta varias keys típicas
          return String(json?.sub ?? json?.id ?? json?._id ?? '') || null;
        }
      } catch { /* ignora */ }
    }

    // 3) Agrega aquí tu AuthService real si lo tienes. Si quieres, pásame el archivo y lo conecto.
    return null;
  }
}
