import { Component, HostListener, OnInit, ViewChild, ViewChildren, ViewEncapsulation } from '@angular/core';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DataTableDirective } from 'angular-datatables';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { Usuario } from 'src/app/interfaces/auth/usuario';
import { AlumnoService } from 'src/app/service/alumno.service';
import { AuthService } from 'src/app/service/auth.service';
import { DocenteService } from 'src/app/service/docente.service';
import { languageDataTable } from 'src/app/util/helpers';

@Component({
  selector: 'app-docente',
  templateUrl: './docente.component.html',
  styleUrls: ['./docente.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DocenteComponent implements OnInit {

  constructor(private docenteService:DocenteService, private alumnoService:AlumnoService, private modalservice: NgbModal,public authService: AuthService,private spinner: NgxSpinnerService) { }
  usuario: Usuario = null;
  listaCursos:any=[];
  listaAlumnos:any=[];
  listaNotas:any=[];

  @ViewChild('modal_editar_notas') modal_editar_notas: NgbModalRef;
  modal_editar_notas_va: any;
  notaPonderada:string='0.00';
  inputEnFoco: boolean = false;

  @HostListener('focusin', ['$event'])
  onFocus(event: FocusEvent): void {
    const target = event.target as HTMLElement;

    if (target.tagName === 'INPUT') {
      this.inputEnFoco = true;
      console.log('Input enfocado:', target);
    }
  }

  @HostListener('focusout', ['$event'])
  onBlur(event: FocusEvent): void {
    const target = event.target as HTMLElement;

    if (target.tagName === 'INPUT') {
      this.inputEnFoco = false;
      console.log('Input perdió el foco:', target);
    }
  }
  
  @ViewChildren(DataTableDirective) private dtElements;
  datatable_lista_alumnos: DataTables.Settings = {};
  datatable_dtTrigger_lista_alumnos: Subject<ADTSettings> = new Subject<ADTSettings>();
  cursoSeleccionado:any=null;
  alumnoSeleccionado:any=null;
  modalOpciones: NgbModalOptions = {
    centered: true,
    animation: true,
    backdrop: 'static',
    keyboard: false
  }
  notaPoderada:string | number ="-";
  notaPoderadaAlumno:string | number ="-";

  invalidGuardarNotas:boolean=true;
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
              return '<div class="btn-group"><button type="button" style ="margin-right:5px;" class="btn-sunarp-black ver_detalle mr-3"><i class="fa fa-eye" aria-hidden="true"></i> Ver</button><button type="button" class="btn-sunarp-red editar_notas mr-3"><i class="fa fa-pencil" aria-hidden="true"></i> Editar</button></div';
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
          $('.editar_notas', row).off().on('click', () => {
            this.seleccionAlumno(data);
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

  seleccionAlumno(data:any){
    this.spinner.show();
    this.alumnoService.listarNotas(this.cursoSeleccionado.id, data.id).subscribe({
      next: resp => {
        this.alumnoSeleccionado=data;
        this.modal_editar_notas_va = this.modalservice.open(this.modal_editar_notas, { ...this.modalOpciones, size: 'lg' });
        this.listaNotas=resp;
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

  formatearNota(index: number): void {
    this.notaPoderada="-";
    this.notaPoderadaAlumno="-";
    const nota = this.listaNotas[index].nota;
    if (nota === null || nota === '' || isNaN(nota) || nota < 0 || nota > 20) {
      this.listaNotas[index].nota = '';
      this.listaNotas[index].notaAlumno = '';
      return;
    }
    this.listaNotas[index].nota = this.formatearDecimal(nota);
    this.listaNotas[index].notaAlumno = this.notaFavorAlumno(nota);
    this.notaPoderada=this.calcularPromedio();
    this.notaPoderadaAlumno=this.calcularPromedioFavorAlumno();
  }

  
  notaFavorAlumno(value: number): string {
    const rounded = value % 1 > 0.5 ? Math.ceil(value) : Math.floor(value);
    return rounded < 10 ? `0${rounded}` : `${rounded}`;
  }

  validarRango(valor: string | number | null): 'valid' | 'invalid' | 'empty' {
    if (valor === null || valor === '') {
      return 'empty';
    }
    const nota = parseFloat(valor.toString());
    if (isNaN(nota) || nota < 0 || nota > 20) {
      return 'invalid'; 
    }
    return 'valid';
    
  }
  formatearDecimal(valor: string | number): string {
    const num = parseFloat(valor.toString());
    return num.toFixed(2); 
  }

  tieneNotasInvalidas(): boolean {
    const todasNulas = this.listaNotas.every(nota => nota.nota === null || nota.nota === undefined || nota.nota === '');
    if (todasNulas) {
      return true;
    }
    const algunaInvalida = this.listaNotas.some(nota => {
      const valor = nota.nota;
      return valor !== null && valor !== undefined && valor !== '' && (isNaN(valor) || valor < 0 || valor > 20);
    });
    return algunaInvalida;
  }
  
  todasNotasValidas(): boolean {
    return this.listaNotas.every(nota => {
      const valor = nota.nota;
      return valor !== null && valor !== undefined && valor !== '' && !isNaN(valor) && valor >= 0 && valor <= 20;
    });
  }
  calcularPromedio(): string | number {
    if (!this.todasNotasValidas()) {
      return '-';
    }
    const promedio = this.listaNotas.reduce((acumulador, nota) => {
      const valor = nota.nota;
      const porcentaje = nota.porcentaje;
      return acumulador + (valor * (porcentaje / 100));
    }, 0);
    return promedio.toFixed(2);
  }
  calcularPromedioFavorAlumno(){
    if (!this.todasNotasValidas()) {
      return '-';
    }
    const promedio = this.listaNotas.reduce((acumulador, nota) => {
      const valor = nota.notaAlumno;
      const porcentaje = nota.porcentaje;
      return acumulador + (valor * (porcentaje / 100));
    }, 0);
    return this.notaFavorAlumno(promedio);
  }

  guardarNotas(){
      console.log(this.listaNotas);
  }

}
