import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function Home() {
  try {
    const session = await getServerSession(authOptions);

    if (session) {
      redirect('/dashboard');
    } else {
      redirect('/login');
    }
  } catch (error) {
    console.error('Error in home page:', error);
    redirect('/login');
  }
}
