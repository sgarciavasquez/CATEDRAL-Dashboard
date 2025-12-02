import { Injectable } from '@angular/core';
import {
    PushNotifications,
    PushNotificationSchema,
    Token,
    ActionPerformed,
} from '@capacitor/push-notifications';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PushService {
    private apiBase = 'https://catedral-api.onrender.com/';

    constructor(private http: HttpClient) { }

    async init() {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive !== 'granted') {
            permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
            console.warn('[Push] Permiso denegado');
            return;
        }

        await PushNotifications.register();

        PushNotifications.addListener('registration', (token: Token) => {
            console.log('[Push] token', token.value);
            this.sendTokenToBackend(token.value);
        });

        PushNotifications.addListener('registrationError', (error) => {
            console.error('[Push] registration error', error);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
            console.log('[Push] recibida en foreground', notification);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
            console.log('[Push] acción', action);
        });
    }

    private sendTokenToBackend(token: string) {
        this.http.post(`${this.apiBase}/notifications/register-device`, {
            token,
            platform: 'android', // calza con DevicePlatform.ANDROID
        }).subscribe({
            next: () => console.log('[Push] token enviado al backend'),
            error: (err) => console.error('[Push] error enviando token', err),
        });
    }
}
