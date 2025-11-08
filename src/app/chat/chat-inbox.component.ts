// chat-inbox.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FooterComponent } from "../shared/components/footer/footer";
import { HeaderComponent } from "../shared/components/header/header";
import { ChatStoreService } from './chat.store.service';
import type { Role } from '../shared/services/chat/chat.types';
@Component({
  standalone: true,
  selector: 'app-chat-inbox',
  imports: [CommonModule, RouterModule, FooterComponent, HeaderComponent],
  templateUrl: './chat-inbox.component.html',
})
export class ChatInboxComponent {
  // HAZLO PÚBLICO para acceso desde el template:
  svc = inject(ChatStoreService);
  route = inject(ActivatedRoute);

  isAdmin = !!this.route.snapshot.data?.['admin'];
  role: Role = this.isAdmin ? 'admin' : 'cliente';
  base = this.isAdmin ? '/admin/chat' : '/chat';

  constructor() {
    this.svc.loadInbox(this.role);
  }
}
