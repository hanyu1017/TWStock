'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('密碼不一致');
      return;
    }

    if (password.length < 6) {
      setError('密碼至少需要 6 個字元');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '註冊失敗');
        return;
      }

      // Redirect to login page
      router.push('/login?registered=true');
    } catch (error) {
      setError('註冊時發生錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            TWStock
          </h1>
          <p className="text-slate-300">
            台灣股票投資組合追蹤系統
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>註冊新帳號</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <Input
                label="姓名"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="您的姓名"
              />

              <Input
                label="電子郵件"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />

              <Input
                label="密碼"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 個字元"
                required
              />

              <Input
                label="確認密碼"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次輸入密碼"
                required
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                註冊
              </Button>

              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                已經有帳號？{' '}
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  登入
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
