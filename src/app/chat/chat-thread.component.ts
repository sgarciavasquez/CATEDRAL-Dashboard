import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChatMockService } from './chat-mock.service';
import { FooterComponent } from "../shared/components/footer/footer";
import { HeaderComponent } from "../shared/components/header/header";

@Component({
  standalone: true,
  selector: 'app-chat-thread',
  imports: [CommonModule, RouterModule, FormsModule, FooterComponent, HeaderComponent],
  templateUrl: './chat-thread.component.html',
})
export class ChatThreadComponent {
  svc = inject(ChatMockService);
  route = inject(ActivatedRoute);

  me = this.svc.currentUser;
  chatId = this.route.snapshot.paramMap.get('id')!;
  isAdmin = !!this.route.snapshot.data?.['admin'];
  base = this.isAdmin ? '/admin/chat' : '/chat';

  msgs = this.svc.messagesByChat(this.chatId);
  draft = signal('');

  otherName = computed(() => {
    const c = this.svc.chats$().find(x => x.id === this.chatId);
    return c?.otherName ?? 'Tienda';
  });

  constructor() { this.svc.markChatRead(this.chatId); }

  send() {
    const text = this.draft().trim();
    if (!text) return;
    this.svc.send(this.chatId, this.me().id, text);
    this.draft.set('');
  }
}
