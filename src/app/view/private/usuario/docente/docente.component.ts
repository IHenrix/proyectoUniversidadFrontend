import { Component, OnInit, ViewChildren } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { Usuario } from 'src/app/interfaces/auth/usuario';
import { AuthService } from 'src/app/service/auth.service';
import { DocenteService } from 'src/app/service/docente.service';
import { languageDataTable } from 'src/app/util/helpers';

@Component({
  selector: 'app-docente',
  templateUrl: './docente.component.html',
  styleUrls: ['./docente.component.scss']
})
export class DocenteComponent implements OnInit {

  constructor(private docenteService:DocenteService,public authService: AuthService,private spinner: NgxSpinnerService) { }
  usuario: Usuario = null;
  listaCursos:any=[];
  listaAlumnos:any=[];

  @ViewChildren(DataTableDirective) private dtElements;
  datatable_lista_alumnos: DataTables.Settings = {};
  datatable_dtTrigger_lista_alumnos: Subject<ADTSettings> = new Subject<ADTSettings>();
  cursoSeleccionado:any=null;

  ngOnInit() {
    this.usuario = this.authService.usuario;
    setTimeout(() => {
      this.datatable_lista_alumnos = {
        dom: '<"top"if>rt<"bottom">p<"clear">',
        paging: true,
        pagingType: 'full_numbers',
        pageLength: 10,
        responsive: true,
        language: languageDataTable("Alumnos"),
        columns: [
          { data: 'id' },
          { data: 'codigo' },
          { data: 'nombre' },
          { data: 'paterno' },
          { data: 'materno' },
          {
            data: 'id', render: (data: any, type: any, full: any) => {
              return '<div class="btn-group"><button type="button" style ="margin-right:5px;" class="btn-sunarp-cyan ver_detalle mr-3"><i class="fa fa-eye" aria-hidden="true"></i> Ver Calificaciones</button><button type="button" class="btn-sunarp-red generar_reporte mr-3"><i class="fa fa-file" aria-hidden="true"></i> Editar Calificaciones</button></div';
            }
          },
        ],
        columnDefs: [
          { orderable: false, className: "text-center align-middle", targets: 0, },
          { className: "text-center align-middle", targets: '_all' }
        ],
        rowCallback: (row: Node, data: any[] | Object, index: number) => {
          $('.ver_detalle', row).off().on('click', () => {
            
          });
          $('.generar_reporte', row).off().on('click', () => {
           
          });
          row.childNodes[0].textContent = String(index + 1);
          return row;
        }
      }
    });
    this.listarCursos();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.datatable_dtTrigger_lista_alumnos.next(this.datatable_lista_alumnos);
    }, 200);
  }
  
  listarCursos(){
    this.spinner.show();
    this.docenteService.listarCursos(this.usuario.id).subscribe({
      next: resp => {
        this.listaCursos=resp;
        this.spinner.hide();
      },
      error() {
        this.spinner.hide();
      },
    })
  }

  seleccionarCurso(curso:any){
    this.spinner.show();
    this.docenteService.listarAlumnos(curso.id).subscribe({
      next: resp => {
        this.listaAlumnos=resp;
        this.cursoSeleccionado=curso;
        this.recargarTabla();
        this.spinner.hide();
      },
      error() {
        this.spinner.hide();
      },
    })
  }

  regresarListaCursos(){
    this.cursoSeleccionado=null;
  }

  recargarTabla() {
    let tabla_ren = this.dtElements._results[0].dtInstance;
    tabla_ren.then((dtInstance: DataTables.Api) => {
      dtInstance.search('').clear().rows.add(this.listaAlumnos).draw();
    });
  }

}
