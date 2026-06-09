import { redirect } from 'next/navigation';

/** Legacy route — sign in is on the home page. */
export default function LoginPage() {
  redirect('/');
}
