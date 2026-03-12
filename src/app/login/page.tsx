import AuthForm from '@/components/AuthForm';
import styles from './page.module.css';

export default function LoginPage() {
  return (
    <main className={styles.container}>
      <AuthForm />
    </main>
  );
}
