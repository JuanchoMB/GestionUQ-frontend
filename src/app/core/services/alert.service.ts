import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  success(title: string, text?: string): void {
    Swal.fire({
      icon: 'success',
      title,
      text,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#1f5f85'
    });
  }

  error(title: string, text?: string): void {
    Swal.fire({
      icon: 'error',
      title,
      text: text || 'Ocurrió un error inesperado.',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#1f5f85'
    });
  }

  warning(title: string, text?: string): void {
    Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#1f5f85'
    });
  }

  info(title: string, text?: string): void {
    Swal.fire({
      icon: 'info',
      title,
      text,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#1f5f85'
    });
  }

  async confirm(
    title: string,
    text: string,
    confirmButtonText: string = 'Sí, continuar'
  ): Promise<boolean> {
    const result = await Swal.fire({
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#b91c1c',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      background: '#ffffff',
      color: '#102a13'
    });

    return result.isConfirmed;
  }

  loading(title: string = 'Procesando...'): void {
    Swal.fire({
      title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  close(): void {
    Swal.close();
  }
}
