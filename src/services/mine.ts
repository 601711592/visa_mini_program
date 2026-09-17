import request from '@/utils/request';
import type { AuthResponse } from './login';
export interface Member {
  id: number;
  mini_program_id: number;
  nickname: string;
  avatar: string;
  phone_masked: string;
  phone_bound: boolean;
}
export const getCurrentUserInfo = (token?: string) => request<AuthResponse<Member>>({ url: '/member/current', token });
