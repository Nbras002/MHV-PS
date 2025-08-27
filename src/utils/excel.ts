import * as XLSX from 'xlsx';
import { Permit } from '../types';

export const exportPermitsToExcel = (permits: Permit[], filename: string = 'permits.xlsx') => {
  const worksheet = XLSX.utils.json_to_sheet(permits.map(permit => ({
    'Permit Number': permit.permitNumber,
    'Date': new Date(permit.date).toLocaleDateString(),
    'Region': permit.region,
    'Location': permit.location,
    'Carrier Name': permit.carrierName,
    'Carrier ID': permit.carrierId,
    'Request Type': permit.requestType,
    'Vehicle Plate': permit.vehiclePlate,
    'Materials': permit.materials.map(m => `${m.description} (${m.serialNumber})`).join('; '),
    'Status': permit.closedAt ? 'Closed' : 'Active',
    'Closed By': permit.closedByName || '',
    'Closed At': permit.closedAt ? new Date(permit.closedAt).toLocaleDateString() : '',
    'Created At': new Date(permit.createdAt).toLocaleDateString()
  })));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Permits');
  XLSX.writeFile(workbook, filename);
};