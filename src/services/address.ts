import request from '@/utils/request';

export interface Address {
  id: number;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  street: string;
  is_default: boolean;
}

export type AddressInput = Omit<Address, 'id'>;

export function getAddresses() {
  return request<API.ResponseBody<Address[]>>({ url: '/member/addresses', method: 'GET' });
}

export function addAddress(data: AddressInput) {
  return request<API.ResponseBody<Address>>({ url: '/member/addresses', method: 'POST', data });
}

export function updateAddress(id: number, data: AddressInput) {
  return request<API.ResponseBody<Address>>({ url: `/member/addresses/${id}`, method: 'PUT', data });
}

export function deleteAddress(id: number) {
  return request<API.ResponseBody<[]>>({ url: `/member/addresses/${id}`, method: 'DELETE' });
}

export function setDefaultAddress(id: number) {
  return request<API.ResponseBody<Address>>({ url: `/member/addresses/${id}/default`, method: 'PUT' });
}
