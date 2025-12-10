import { useState, useEffect } from 'react';

export interface Employee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  assignedPropertyId?: string;
  assignedPropertyName?: string;
  status: 'active' | 'inactive' | 'pending';
  role: 'employee';
  hiredAt: string;
  landlordId: string;
}

const STORAGE_KEY = 'employees';

// Mock employees for demo
const mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    email: 'james.kamau@demo.com',
    firstName: 'James',
    lastName: 'Kamau',
    phone: '+254 711 111 111',
    assignedPropertyId: 'p1',
    assignedPropertyName: 'Sunset Apartments',
    status: 'active',
    role: 'employee',
    hiredAt: '2024-01-15',
    landlordId: 'demo-landlord',
  },
  {
    id: 'emp-2',
    email: 'mary.wanjiku@demo.com',
    firstName: 'Mary',
    lastName: 'Wanjiku',
    phone: '+254 722 222 222',
    assignedPropertyId: 'p2',
    assignedPropertyName: 'Ocean View Towers',
    status: 'active',
    role: 'employee',
    hiredAt: '2024-03-20',
    landlordId: 'demo-landlord',
  },
  {
    id: 'emp-3',
    email: 'peter.omondi@demo.com',
    firstName: 'Peter',
    lastName: 'Omondi',
    phone: '+254 733 333 333',
    status: 'pending',
    role: 'employee',
    hiredAt: '2024-06-01',
    landlordId: 'demo-landlord',
  },
];

const getStoredEmployees = (): Employee[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with mock data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockEmployees));
    return mockEmployees;
  } catch {
    return mockEmployees;
  }
};

const saveEmployees = (employees: Employee[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
};

export function useEmployees(landlordId?: string) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      const allEmployees = getStoredEmployees();
      // Filter by landlord if provided
      const filtered = landlordId 
        ? allEmployees.filter(e => e.landlordId === landlordId || e.landlordId === 'demo-landlord')
        : allEmployees;
      setEmployees(filtered);
      setIsLoading(false);
    }, 300);
  }, [landlordId]);

  const addEmployee = async (data: Omit<Employee, 'id' | 'hiredAt'>): Promise<Employee> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newEmployee: Employee = {
      ...data,
      id: `emp-${Date.now()}`,
      hiredAt: new Date().toISOString(),
    };
    
    const updated = [...employees, newEmployee];
    setEmployees(updated);
    saveEmployees([...getStoredEmployees(), newEmployee]);
    return newEmployee;
  };

  const updateEmployee = async (id: string, data: Partial<Employee>): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const allEmployees = getStoredEmployees();
    const updatedAll = allEmployees.map(emp => 
      emp.id === id ? { ...emp, ...data } : emp
    );
    saveEmployees(updatedAll);
    
    setEmployees(prev => prev.map(emp => 
      emp.id === id ? { ...emp, ...data } : emp
    ));
  };

  const activateEmployee = async (id: string): Promise<void> => {
    await updateEmployee(id, { status: 'active' });
  };

  const deactivateEmployee = async (id: string): Promise<void> => {
    await updateEmployee(id, { status: 'inactive' });
  };

  const assignToProperty = async (id: string, propertyId: string, propertyName: string): Promise<void> => {
    await updateEmployee(id, { 
      assignedPropertyId: propertyId, 
      assignedPropertyName: propertyName 
    });
  };

  const removeEmployee = async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const allEmployees = getStoredEmployees();
    const updatedAll = allEmployees.filter(emp => emp.id !== id);
    saveEmployees(updatedAll);
    
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  };

  const getActiveCount = () => employees.filter(e => e.status === 'active').length;
  const getPendingCount = () => employees.filter(e => e.status === 'pending').length;

  return {
    employees,
    isLoading,
    addEmployee,
    updateEmployee,
    activateEmployee,
    deactivateEmployee,
    assignToProperty,
    removeEmployee,
    getActiveCount,
    getPendingCount,
  };
}
