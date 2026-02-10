import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize, timeout } from 'rxjs/operators';

import { EmployeesService } from './employees.service';
import { Employee } from './employee.model';

type CreateEmployee = {
  fullName: string;
  document: string;
  email: string;
  hireDate: string; // yyyy-MM-dd
};

type UpdateEmployee = {
  fullName: string;
  document: string;
  email: string;
  hireDate: string; // yyyy-MM-dd
  isActive: boolean;
};

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './employees.html',
  styleUrls: ['./employees.css']
})
export class Employees implements OnInit {
  employees: Employee[] = [];
  employeesAll: Employee[] = []; // público porque a tela usa isso

  searchTerm = '';

  isLoading = false;
  errorMessage: string | null = null;

  // CREATE (POST)
  isCreateOpen = false;
  isCreating = false;
  createError: string | null = null;

  // EDIT (PUT)
  isEditOpen = false;
  isUpdating = false;
  editError: string | null = null;
  editing: Employee | null = null;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly fb = inject(FormBuilder);

  createForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    document: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    hireDate: ['', [Validators.required]], // yyyy-MM-dd
  });

  editForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    document: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    hireDate: ['', [Validators.required]], // yyyy-MM-dd
    isActive: [true, [Validators.required]],
  });

  constructor(private service: EmployeesService) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.load();
    }
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.service.getAll()
      .pipe(
        timeout(8000),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (data) => {
          this.employeesAll = data ?? [];
          this.applyFilter();
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Não foi possível carregar os funcionários. Tente novamente.';
        }
      });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.employees = [...this.employeesAll];
      return;
    }

    this.employees = this.employeesAll.filter((e) =>
      e.fullName.toLowerCase().includes(term) ||
      e.email.toLowerCase().includes(term) ||
      e.document.toLowerCase().includes(term)
    );
  }

  // ---------- CREATE (POST) ----------
  openCreate(): void {
    this.createError = null;
    this.createForm.reset();
    this.isCreateOpen = true;
  }

  closeCreate(): void {
    if (this.isCreating) return;
    this.isCreateOpen = false;
  }

  submitCreate(): void {
    this.createError = null;

    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const payload: CreateEmployee = {
      fullName: this.createForm.value.fullName!,
      document: this.createForm.value.document!,
      email: this.createForm.value.email!,
      hireDate: this.createForm.value.hireDate!,
    };

    this.isCreating = true;

    this.service.create(payload)
      .pipe(finalize(() => {
        this.isCreating = false;
      }))
      .subscribe({
        next: (created) => {
          // adiciona no topo + reaplica filtro
          this.employeesAll = [created, ...this.employeesAll];
          this.applyFilter();

          // Pergunta se deseja cadastrar outro
          const addAnother = confirm('Funcionário cadastrado com sucesso!\n\nDeseja incluir outro funcionário?');
          
          if (addAnother) {
            this.createForm.reset();
            this.createError = null;
          } else {
            this.isCreateOpen = false;
          }
        },
        error: (err) => {
          console.error(err);
          this.createError = err?.error?.message ?? 'Erro ao cadastrar funcionário.';
        }
      });
  }

  // ---------- EDIT (PUT) ----------
  openEdit(e: Employee): void {
    this.editError = null;
    this.editing = e;
    this.isEditOpen = true;

    this.editForm.setValue({
      fullName: e.fullName,
      document: e.document,
      email: e.email,
      hireDate: (e.hireDate ?? '').substring(0, 10), // garante yyyy-MM-dd
      isActive: !!e.isActive
    });
  }

  closeEdit(): void {
    if (this.isUpdating) return;
    this.isEditOpen = false;
    this.editing = null;
  }

  submitEdit(): void {
    this.editError = null;

    if (!this.editing) return;

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const payload: UpdateEmployee = {
      fullName: this.editForm.value.fullName!,
      document: this.editForm.value.document!,
      email: this.editForm.value.email!,
      hireDate: this.editForm.value.hireDate!,
      isActive: !!this.editForm.value.isActive
    };

    const editingId = this.editing.id;
    this.isUpdating = true;

    this.service.update(editingId, payload)
      .pipe(
        timeout(8000),
        finalize(() => {
          this.isUpdating = false;
        })
      )
      .subscribe({
        next: () => {
          // atualiza localmente sem reload
          const idx = this.employeesAll.findIndex(x => x.id === editingId);
          if (idx >= 0) {
            const updated: Employee = {
              ...this.employeesAll[idx],
              fullName: payload.fullName,
              document: payload.document,
              email: payload.email,
              hireDate: payload.hireDate,
              isActive: payload.isActive
            };
            this.employeesAll[idx] = updated;
            this.applyFilter();
          }

          // Fecha modal após atualização com sucesso
          this.isEditOpen = false;
          this.editing = null;
          this.editError = null;
        },
        error: (err) => {
          console.error(err);
          this.editError = err?.error?.message ?? 'Erro ao atualizar funcionário.';
        }
      });
  }

  trackById(_: number, e: Employee): string {
    return e.id;
  }
}
