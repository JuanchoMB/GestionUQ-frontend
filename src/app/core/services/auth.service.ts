import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuthMeResponse, LoginRequest, LoginResponse } from '../models/auth.model';
import { RolUsuario } from '../models/enums';

const TOKEN_KEY = 'triage_token';
const USER_KEY = 'triage_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private readonly currentUserSubject = new BehaviorSubject<AuthMeResponse | null>(this.readStoredUser());

  readonly currentUser$ = this.currentUserSubject.asObservable();

  login(request: LoginRequest): Observable<AuthMeResponse | null> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.baseUrl}/login`, request).pipe(
      tap(response => {
        localStorage.setItem(TOKEN_KEY, response.data.token);
        const partialUser: AuthMeResponse = {
          id: '',
          username: response.data.username,
          nombreCompleto: response.data.username,
          identificacion: '',
          authenticated: true,
          roles: response.data.roles.map(r => this.normalizeRole(r)),
          activo: true
        };
        this.storeUser(partialUser);
      }),
      switchMap(() => this.loadMe()),
      catchError(error => {
        this.logout(false);
        throw error;
      })
    );
  }

  loadMe(): Observable<AuthMeResponse | null> {
    if (!this.getToken()) return of(null);
    return this.http.get<ApiResponse<AuthMeResponse>>(`${this.baseUrl}/me`).pipe(
      map(response => response.data),
      tap(user => this.storeUser({ ...user, roles: user.roles.map(r => this.normalizeRole(r)) })),
      catchError(() => of(this.currentUserSubject.value))
    );
  }

  logout(navigate = true): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
    if (navigate) this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get currentUser(): AuthMeResponse | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasAnyRole(roles: RolUsuario[]): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;
    return user.roles.some(role => roles.includes(role));
  }

  normalizeRole(role: string): RolUsuario {
    return role.replace('ROLE_', '') as RolUsuario;
  }

  private storeUser(user: AuthMeResponse): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private readStoredUser(): AuthMeResponse | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthMeResponse;
    } catch {
      return null;
    }
  }
}
