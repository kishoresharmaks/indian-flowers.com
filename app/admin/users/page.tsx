import { redirect } from 'next/navigation';

export default function AdminUsersRoute() {
  redirect('/admin/dashboard?tab=customers');
}
