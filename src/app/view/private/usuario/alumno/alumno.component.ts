import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Usuario } from 'src/app/interfaces/auth/usuario';
import { AlumnoService } from 'src/app/service/alumno.service';
import { AuthService } from 'src/app/service/auth.service';

@Component({
  selector: 'app-alumno',
  templateUrl: './alumno.component.html',
  styleUrls: ['./alumno.component.scss']
})
export class AlumnoComponent implements OnInit {

  constructor(private alumnoService: AlumnoService, public authService: AuthService,private spinner: NgxSpinnerService) { }
  usuario: Usuario = null;
  listaCursos:any=[];

  ngOnInit() {
    this.spinner.show();
    this.usuario = this.authService.usuario;
    this.alumnoService.listarCursos(this.usuario.id).subscribe({
      next: resp => {
        this.listaCursos=resp;
        this.spinner.hide();
      },
      error() {
        this.spinner.hide();
      },
    })
  }

}
