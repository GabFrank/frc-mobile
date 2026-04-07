import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, of, Subscription } from 'rxjs';
import { catchError, take, timeout } from 'rxjs/operators';
import { serverAdress } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class HoraServidorService implements OnDestroy {
    private offsetMs = 0;
    private sincronizado = false;
    horaActual$ = new BehaviorSubject<Date>(new Date());
    private readonly INTERVALO_SYNC_MS = 5 * 60 * 1000; // 5 minutos
    private syncSub: Subscription;
    private tickSub: Subscription;

    constructor(private http: HttpClient) {
        this.sincronizarConServidor();
        this.syncSub = interval(this.INTERVALO_SYNC_MS)
            .subscribe(() => this.sincronizarConServidor());
        this.tickSub = interval(1000)
            .subscribe(() => {
                const horaCorregida = new Date(Date.now() + this.offsetMs);
                this.horaActual$.next(horaCorregida);
            });
    }

    obtenerHoraActual(): Date {
        return new Date(Date.now() + this.offsetMs);
    }

    estaSincronizado(): boolean {
        return this.sincronizado;
    }

    sincronizarConServidor(): void {
        const serverIp = localStorage.getItem('serverIp') || serverAdress.serverIp;
        const serverPort = localStorage.getItem('serverPort') || serverAdress.serverPort;
        const url = `http://${serverIp}:${serverPort}/config/hora-servidor`;

        const antesRequest = Date.now();

        this.http.get<{ horaServidor: string, timestamp: number }>(url)
            .pipe(
                timeout(5000),
                take(1),
                catchError(err => {
                    console.warn('HoraServidorService: No se pudo sincronizar con el servidor', err);
                    return of(null);
                })
            )
            .subscribe(res => {
                if (res && res.timestamp) {
                    const despuesRequest = Date.now();
                    const latenciaEstimada = (despuesRequest - antesRequest) / 2;
                    const horaServidorAjustada = res.timestamp + latenciaEstimada;
                    this.offsetMs = horaServidorAjustada - despuesRequest;
                    this.sincronizado = true;
                    this.horaActual$.next(new Date(Date.now() + this.offsetMs));
                    console.log(`HoraServidorService: Sincronizado. Offset: ${this.offsetMs}ms`);
                }
            });
    }

    ngOnDestroy(): void {
        if (this.syncSub) this.syncSub.unsubscribe();
        if (this.tickSub) this.tickSub.unsubscribe();
    }
}
