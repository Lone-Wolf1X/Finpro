import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginStart, loginSuccess, loginFailure } from './authSlice';
import { authService } from './authService';
import { Lock, Mail, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector((state) => state.auth);

    const [email, setEmail] = useState('100');
    const [password, setPassword] = useState('100');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Please enter both email and password');
            return;
        }

        dispatch(loginStart());

        try {
            const response = await authService.login({ email, password });
            dispatch(loginSuccess(response));
            toast.success('Login successful!');

            // Redirect based on role
            if (response.user.role === 'SUPERADMIN') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            console.error("Login Error Details:", err);
            const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
            dispatch(loginFailure(errorMessage));
            toast.error(errorMessage);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Left Side - Branding & Image */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary-900 to-primary-700 relative overflow-hidden flex-col justify-between p-12 text-white">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
                            <span className="font-bold text-xl">FP</span>
                        </div>
                        <span className="text-2xl font-bold tracking-tight">Finpro</span>
                    </div>
                    <h1 className="text-5xl font-bold leading-tight mb-6">
                        Manage your <br />
                        Financial Future
                    </h1>
                    <p className="text-lg text-primary-100 max-w-md">
                        Comprehensive financial management platform for modern businesses. Secure, scalable, and efficient.
                    </p>
                </div>

                <div className="relative z-10 flex items-center gap-4 text-sm text-primary-200">
                    <span>© 2026 Next Gen Innovations Nepal</span>
                    <div className="w-1 h-1 bg-primary-400 rounded-full"></div>
                    <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                    <div className="w-1 h-1 bg-primary-400 rounded-full"></div>
                    <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                </div>

                {/* Abstract Background Shapes */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-secondary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <div className="lg:hidden flex justify-center mb-6">
                            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">FP</div>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
                        <p className="mt-2 text-gray-500">Please enter your details to sign in.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email or User ID
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="email"
                                        type="text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="input-field pl-10 w-full py-3"
                                        placeholder="Enter your email or ID"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="input-field pl-10 w-full py-3"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end mt-1">
                                    <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                                        Forgot password?
                                    </a>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2 animate-pulse">
                                <div className="font-bold">Error:</div>
                                <div>{error} {error === 'Network Error' && '- Is the backend server running?'}</div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-lg font-semibold shadow-lg shadow-primary-500/30 hover:shadow-primary-600/40 transition-all transform active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Sign in
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                            Contact support
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
