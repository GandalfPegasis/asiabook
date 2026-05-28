import { ref, computed } from 'vue';

const isAuthenticated = ref(false);
const user = ref<any>(null);
const token = ref<string | null>(null);

export function useAuth() {
    const initAuth = () => {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        if (storedToken && storedUser) {
            token.value = storedToken;
            user.value = JSON.parse(storedUser);
            isAuthenticated.value = true;
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Login failed');
            }

            const data = await response.json();
            token.value = data.token;
            user.value = data.user;
            isAuthenticated.value = true;

            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('auth_user', JSON.stringify(data.user));

            return { success: true };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
        }
    };

    const signup = async (name: string, email: string, password: string, confirmPassword: string) => {
        try {
            const response = await fetch('http://localhost:3000/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, confirmPassword }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Signup failed');
            }

            const data = await response.json();
            token.value = data.token;
            user.value = data.user;
            isAuthenticated.value = true;

            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('auth_user', JSON.stringify(data.user));

            return { success: true };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Signup failed' };
        }
    };

    const logout = () => {
        token.value = null;
        user.value = null;
        isAuthenticated.value = false;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    };

    return {
        isAuthenticated: computed(() => isAuthenticated.value),
        user: computed(() => user.value),
        token: computed(() => token.value),
        initAuth,
        login,
        signup,
        logout,
    };
}
