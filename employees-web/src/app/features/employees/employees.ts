import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeesService } from './employees.service';
import { Employee } from './employee.model';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employees.html'
})
export class Employees implements OnInit {
  employees: Employee[] = [];

  constructor(private service: EmployeesService) {}

  ngOnInit(): void {
    this.service.getAll().subscribe({
      next: data => (this.employees = data),
      error: err => console.error('Erro ao carregar employees:', err)
    });
  }
}
