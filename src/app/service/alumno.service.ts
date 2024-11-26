import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AlumnoService {
  constructor(
    private http: HttpClient,
  ) {
  }
  private baseEndpoint = environment.urlApiMicroservices.domain + '/alumno';

  listarCursos(usuarioId: number): Observable<any> {
    let params = new HttpParams();
    params = params.append('usuarioId', usuarioId);
    return this.http.get<any>(this.baseEndpoint + '/cursos', { params: params })
  }
}
