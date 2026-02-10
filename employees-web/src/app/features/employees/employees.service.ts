import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee } from './employee.model';

export type CreateEmployee = {
  fullName: string;
  document: string;
  email: string;
  hireDate: string;
};
@Injectable({ providedIn: 'root' })
export class EmployeesService {
  private readonly apiUrl = '/api/Employees';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl);
  }
  create(payload: CreateEmployee): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, payload);
  }
  update(id: string, payload: { fullName: string; document: string; email: string; hireDate: string; isActive: boolean; }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, payload);
  }

}
