export default function Login() {
  const handleLogin = () => {
    const idpUrl = import.meta.env.VITE_IDP_LOGIN_URL || '/auth/login';
    window.location.href = idpUrl;
  };

  return (
    <div className="panel">
      <h2>Login</h2>
      <p>You will be redirected to the Identity Provider to authenticate.</p>
      <button onClick={handleLogin}>Continue to Login</button>
    </div>
  );
}
