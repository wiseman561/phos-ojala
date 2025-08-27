import { useAuth } from '../auth/AuthProvider';

export default function Login() {
  const { loginWithRedirect, isAuthenticated, user } = useAuth();

  const startLogin = async () => {
    await loginWithRedirect();
  };

  if (isAuthenticated) {
    return (
      <div className="panel">
        <h2>Welcome</h2>
        <p>You are logged in{user?.name ? ` as ${user.name}` : ''}.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Login</h2>
      <p>You will be redirected to the Identity Provider to authenticate.</p>
      <button onClick={startLogin}>Continue to Login</button>
    </div>
  );
}
